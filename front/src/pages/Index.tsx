import { MetricCard } from "@/components/MetricCard";
import { EmployeeTable } from "@/components/EmployeeTable";
import { DateFilter } from "@/components/DateFilter";
import { useEffect, useState } from "react";
import { getAgents } from "../data/api";

const Index = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDate(date.toISOString().slice(0, 10));
    }
  };

  const [agentsData, setAgentsData] = useState({
    rows: [],
    countPerson: 0,
    countAllPerson: 0,
    countRespondedCalls: 0,
    percentage: 0,
  });

  useEffect(() => {
    const data = getAgents(date);
    data.then((res) => {
      setAgentsData(res);
    });
  }, [date]);
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Call Center Dashboard
          </h1>
          <p className="text-muted-foreground">
            Xodimlar samaradorligi va qo'ng'iroqlar statistikasi
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard title="Ishdagilar soni" value={agentsData.countPerson} />
          <MetricCard
            title="Jami qo'ng'iroqlar soni"
            value={agentsData.countAllPerson}
          />
          <MetricCard
            title="Ko'tarilgan qo'ng'iroqlar"
            value={agentsData.countRespondedCalls}
          />
          <MetricCard
            title="Plan bajarilishi"
            value={`${(agentsData.percentage * 100).toFixed(1)}%`}
          />
          <DateFilter onDateChange={handleDateChange} />
        </div>

        {/* Employee Performance Table */}
        <EmployeeTable agentsData={agentsData} />
      </div>
    </div>
  );
};

export default Index;
