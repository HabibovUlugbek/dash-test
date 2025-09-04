import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Employee {
  id: number;
  name: string;
  totalCalls: number;
  answeredCalls: number;
  answerRate: number;
  dailyPlan: number;
}

interface EmployeeTableProps {
  employees: Employee[];
}

type SortField =
  | "name"
  | "totalCalls"
  | "answeredCalls"
  | "answerRate"
  | "dailyPlan";

export const EmployeeTable = ({ agentsData }) => {
  const [sortField, setSortField] = useState<SortField>("totalCalls");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedEmployees = [...agentsData.rows].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold text-table-header hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <Card className="bg-card border border-border">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Xodimlar samaradorligi
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-table-header font-semibold">
                  <SortButton field="name">Ism Familya</SortButton>
                </TableHead>
                <TableHead className="text-table-header font-semibold text-right">
                  <SortButton field="totalCalls">Jami qo'ng'iroqlar</SortButton>
                </TableHead>
                <TableHead className="text-table-header font-semibold text-right">
                  <SortButton field="answeredCalls">
                    Javob berilgan qo'ng'iroqlar
                  </SortButton>
                </TableHead>
                <TableHead className="text-table-header font-semibold text-right">
                  <SortButton field="answerRate">
                    Ko'tarilganlik foizi
                  </SortButton>
                </TableHead>
                <TableHead className="text-table-header font-semibold text-right">
                  <SortButton field="dailyPlan">Plan kunlik</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => (
                <TableRow
                  key={employee.Ответственный}
                  className="border-border hover:bg-table-row-hover transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {employee.Ответственный}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {employee?.totalCalls}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {employee?.answeredCalls}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {employee.answerRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {employee.dailyPlan.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="border-border hover:bg-transparent">
                <TableCell className="font-semibold text-foreground">
                  Jami
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">
                  {agentsData.countAllPerson}
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">
                  {agentsData.countRespondedCalls}
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">
                  {(
                    (agentsData.countRespondedCalls * 100) /
                    agentsData.countAllPerson
                  ).toFixed(1)}
                  %
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">
                  {(agentsData.percentage * 100).toFixed(1)} %
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </Card>
  );
};
