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

async function getAgents(date) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(
      `Select spca.addr as "Номер телефона",
       case
         when TODO_PLAN_END_DT<SYSDATE then 'Y'
           else 'N'
             end as "Просрочено",
       scE.last_name||' '||scE.fst_name||' '||scE.mid_name AS "Ответственный",
       sea.target_per_id as "Id по Siebel Клиента",
       seax.x_contact_org as "Филиал клиента",
       (SELECT val FROM siebel.s_lst_of_val slv
         where slv.name=seaf.sub_type_cd
         and slv.type = 'TSC_TODO_SUBTYPE'
         and slv.active_flg = 'Y'
         and slv.lang_id = 'RUS'
         and slv.par_row_id='0LRUS-3129@') as "Подтип",
       scC.last_name||' '||scC.fst_name||' '||scC.mid_name AS "Клиент ФЛ",
       'Звонок исходящая коммуникация' as "Тип", --Тип бу отчет учун узгармайди, шунинг учун константа

       (SELECT val FROM siebel.s_lst_of_val slv
         where slv.name=seax.x_result
         and slv.type = 'TSC_ACTION_RESULT'
         and slv.active_flg = 'Y'
         and slv.lang_id = 'RUS'
         and slv.par_row_id='0LRUS-3129@') as "Результат",

       (SELECT val FROM siebel.s_lst_of_val slv
         where slv.name=sea.nosale_res_cd
         and slv.type = 'FIN_NO_SALE_REASON'
         and slv.active_flg = 'Y'
         and slv.lang_id = 'RUS'
         and slv.par_row_id in
                            ( SELECT row_id FROM siebel.s_lst_of_val slv
                              where slv.type = 'TSC_ACTION_RESULT'
                                and slv.active_flg = 'Y'
                                and slv.lang_id = 'RUS'
                                and slv.name=seax.x_result
                                and slv.par_row_id='0LRUS-3129@')

       ) as "Причина",
       sea.todo_plan_start_dt as "Начало плановое",
       scC.Person_Uid as "Id клиента ИАБС",
       sea.todo_plan_end_dt as "Окончание плановое",
       sea.alarm_flag as "Напомнить",
       ( select val from siebel.s_lst_of_val slv
         where slv.type = 'EVENT_STATUS'
           and slv.active_flg = 'Y'
           and slv.lang_id = 'RUS'
           and slv.name = sea.evt_stat_cd
       ) as "Статус",
       sea.todo_plan_start_dt as "Дата начала",
       sea.activity_uid as "Идентификатор",
       sea.created as "Создано",
       CAST(sea.created AS DATE) AS created_as_date,
       TO_CHAR(sea.created, 'DD.MM.YYYY') AS CREATED_DATE,
       sea.TODO_ACTL_END_DT AS "Дата фактического завершения"

from siebel.s_evt_act sea
join siebel.s_evt_act_x seax on sea.row_id=seax.par_row_id
join siebel.s_evt_act_fnx seaf on sea.row_id=seaf.row_id
left join siebel.S_PER_COMM_ADDR spca on spca.row_id=sea.x_phone_id
left join siebel.s_postn sp on sea.owner_postn_id=sp.row_id
left join siebel.s_contact scE on scE.Row_Id=sp.pr_emp_id
left join siebel.s_contact scC on scC.Row_Id=sea.target_per_id

where sea.todo_cd='Call Outbound Communication'
  and sp.postn_type_cd='Софт специалист'
  and sea.created = TO_DATE('2025-09-04', 'YYYY-MM-DD')`
    );
    console.log("DB data :", result.rows.length);

    const countPerson = [
      ...new Set(result.rows.map((row) => row["Ответственный"])),
    ].length;

    const respondedResults = [
      "Разговор с 3-м лицом",
      "Разговор с клиентом",
      "Разговор с ответственным лицом",
    ];

    const countPersonMap = new Map();
    result.rows.forEach((row) => {
      const agent = row["Ответственный"];
      if (!countPersonMap.has(agent)) {
        countPersonMap.set(agent, { totalCalls: 0, answeredCalls: 0 });
      }
      countPersonMap.get(agent).totalCalls += 1;
      if (respondedResults.includes(row["Результат"])) {
        countPersonMap.get(agent).answeredCalls += 1;
      }
      countPersonMap.get(agent).answerRate =
        (countPersonMap.get(agent).answeredCalls /
          countPersonMap.get(agent).totalCalls) *
        100;
      countPersonMap.get(agent).dailyPlan =
        (countPersonMap.get(agent).answeredCalls / 120) * 100;
    });

    const countAllPerson = result.rows.length;

    const countRespondedCalls = result.rows.filter((row) =>
      respondedResults.includes(row["Результат"])
    ).length;

    const percentage = countRespondedCalls / (countPerson * 120);

    return {
      rows: Array.from(countPersonMap, ([Ответственный, data]) => ({
        Ответственный,
        ...data,
      })),
      countPerson,
      countAllPerson,
      countRespondedCalls,
      percentage,
    };
  } finally {
    await conn.close();
  }
}

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
