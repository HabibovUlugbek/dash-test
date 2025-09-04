require("dotenv").config();
const express = require("express");
const cors = require("cors");
const oracledb = require("oracledb");

const app = express();
app.use(cors());
app.use(express.json());

let pool;

async function initDb() {
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });
}

async function getSummary(date) {
  const conn = await pool.getConnection();
  try {
    const countPerson = await conn.execute(
      `SELECT COUNT(DISTINCT Ответственный) AS countPerson FROM call_center_table WHERE created >= TO_DATE(:date, 'YYYY-MM-DD')`,
      [date]
    );
    const countAllPerson = await conn.execute(
      `SELECT COUNT(Ответственный) AS countAllPerson FROM call_center_table WHERE created >= TO_DATE(:date, 'YYYY-MM-DD')`,
      [date]
    );
    const countPersonResponding = await conn.execute(
      `SELECT COUNT(*) AS countPersonResponding FROM call_center_table WHERE Результат IN (
        'Разговор с 3-м лицом',
        'Разговор с клиентом',
        'Разговор с ответственным лицом'
      ) AND created >= TO_DATE(:date, 'YYYY-MM-DD')`,
      [date]
    );

    const percentPerson =
      countPersonResponding.rows[0].countPersonResponding /
      (countPerson.rows[0].countPerson * 120);

    return {
      countPerson: countPerson.rows[0].countPerson,
      countAllPerson: countAllPerson.rows[0].countAllPerson,
      countPersonResponding:
        countPersonResponding.rows[0].countPersonResponding,
      percentPerson: isNaN(percentPerson) ? 0 : percentPerson,
    };
  } finally {
    await conn.close();
  }
}

async function getAgents(date) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(
      `SELECT
        spca.addr AS "Номер телефона",
        CASE WHEN TODO_PLAN_END_DT < SYSDATE THEN 'Y' ELSE 'N' END AS "Просрочено",
        scE.last_name || ' ' || scE.fst_name || ' ' || scE.mid_name AS "Ответственный",
        sea.target_per_id AS "Id по Siebel Клиента",
        seax.x_contact_org AS "Филиал клиента",
        (SELECT val FROM siebel.s_lst_of_val slv
          WHERE slv.name = seaf.sub_type_cd
            AND slv.type = 'TSC_TODO_SUBTYPE'
            AND slv.active_flg = 'Y'
            AND slv.lang_id = 'RUS'
            AND slv.par_row_id = '0LRUS-3129@') AS "Подтип",
        scC.last_name || ' ' || scC.fst_name || ' ' || scC.mid_name AS "Клиент ФЛ",
        'Звонок исходящая коммуникация' AS "Тип",
        (SELECT val FROM siebel.s_lst_of_val slv
          WHERE slv.name = seax.x_result
            AND slv.type = 'TSC_ACTION_RESULT'
            AND slv.active_flg = 'Y'
            AND slv.lang_id = 'RUS'
            AND slv.par_row_id = '0LRUS-3129@') AS "Результат",
        (SELECT val FROM siebel.s_lst_of_val slv
          WHERE slv.name = sea.nosale_res_cd
            AND slv.type = 'FIN_NO_SALE_REASON'
            AND slv.active_flg = 'Y'
            AND slv.lang_id = 'RUS'
            AND slv.par_row_id IN (
              SELECT row_id FROM siebel.s_lst_of_val slv
              WHERE slv.type = 'TSC_ACTION_RESULT'
                AND slv.active_flg = 'Y'
                AND slv.lang_id = 'RUS'
                AND slv.name = seax.x_result
                AND slv.par_row_id = '0LRUS-3129@'
            )
        ) AS "Причина",
        sea.todo_plan_start_dt AS "Начало плановое",
        scC.Person_Uid AS "Id клиента ИАБС",
        sea.todo_plan_end_dt AS "Окончание плановое",
        sea.alarm_flag AS "Напомнить",
        (SELECT val FROM siebel.s_lst_of_val slv
          WHERE slv.type = 'EVENT_STATUS'
            AND slv.active_flg = 'Y'
            AND slv.lang_id = 'RUS'
            AND slv.name = sea.evt_stat_cd
        ) AS "Статус",
        sea.todo_plan_start_dt AS "Дата начала",
        sea.activity_uid AS "Идентификатор",
        sea.created AS "Создано",
        CAST(sea.created AS DATE) AS created_as_date,
        TO_CHAR(sea.created, 'DD.MM.YYYY') AS CREATED_DATE,
        sea.TODO_ACTL_END_DT AS "Дата фактического завершения"
      FROM siebel.s_evt_act sea
      JOIN siebel.s_evt_act_x seax ON sea.row_id = seax.par_row_id
      JOIN siebel.s_evt_act_fnx seaf ON sea.row_id = seaf.row_id
      LEFT JOIN siebel.S_PER_COMM_ADDR spca ON spca.row_id = sea.x_phone_id
      LEFT JOIN siebel.s_postn sp ON sea.owner_postn_id = sp.row_id
      LEFT JOIN siebel.s_contact scE ON scE.Row_Id = sp.pr_emp_id
      LEFT JOIN siebel.s_contact scC ON scC.Row_Id = sea.target_per_id
      WHERE sea.todo_cd = 'Call Outbound Communication'
        AND sp.postn_type_cd = 'Софт специалист'
        AND sea.created >= TO_DATE(:date, 'YYYY-MM-DD')`,
      [date]
    );
    return result.rows;
  } finally {
    await conn.close();
  }
}

app.get("/api/summary", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const summary = await getSummary(date);
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

app.get("/api/agents", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const agents = await getAgents(date);
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

initDb()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`✅ Backend running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB pool:", err);
  });
