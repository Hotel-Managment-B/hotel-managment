"use client";

import AddEmployee from "@/components/data/AddEmployee";

export default function AddEmployeePage() {
    const handleAddEmployee = (data: any) => {
        // TODO: implement employee submission logic
        console.log("Employee submitted:", data);
    };

    return <AddEmployee onSubmit={handleAddEmployee} />;
}