"use client";

import AddEmployee from "@/components/data/AddEmployee";
import type { EmployeeWithSalary } from "@/components/data/AddEmployee";

export default function AddEmployeePage() {
    const handleAddEmployee = (data: EmployeeWithSalary) => {
        // TODO: implement employee submission logic
        console.log("Employee submitted:", data);
    };

    return <AddEmployee onSubmit={handleAddEmployee} />;
}