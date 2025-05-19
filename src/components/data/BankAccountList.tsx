"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/Index";
import BankAccount from "./BankAccount";

interface BankAccountData {
  id: string;
  accountName: string;
  accountType: string;
  accountNumber: string;
  initialAmount: number;
}

const BankAccountList = () => {
  const [accounts, setAccounts] = useState<BankAccountData[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bankAccount"));
        const accountsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BankAccountData[];
        setAccounts(accountsList);
      } catch (error) {
        console.error("Error al obtener las cuentas bancarias: ", error);
      }
    };

    fetchAccounts();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-start mt-12 px-4">
      <div className="sm:w-1/3 w-full mb-6 sm:mt-0">
        <BankAccount />
      </div>
      <div className="sm:w-2/3 w-full">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-2">
          Cuentas Bancarias
        </h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse border border-blue-400 text-sm sm:text-base">
            <thead>
              <tr className="bg-blue-200">
                <th className="border border-blue-400 px-4 py-2">
                  Nombre de la Cuenta
                </th>
                <th className="border border-blue-400 px-4 py-2">
                  Tipo de Cuenta
                </th>
                <th className="border border-blue-400 px-4 py-2">
                  Número de Cuenta
                </th>
                <th className="border border-blue-400 px-4 py-2">
                  Monto Inicial
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="text-center">
                  <td className="border border-blue-400 px-4 py-2">
                    {account.accountName}
                  </td>
                  <td className="border border-blue-400 px-4 py-2">
                    {account.accountType}
                  </td>
                  <td className="border border-blue-400 px-4 py-2">
                    {account.accountNumber}
                  </td>
                  <td className="border border-blue-400 px-4 py-2">
                    ${account.initialAmount.toLocaleString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BankAccountList;
