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
      <div className="sm:w-2/3 w-full shadow-lg p-4 bg-white rounded-lg">
        <h2 className="text-sm md:text-lg font-bold text-center text-blue-900 mb-2">
          Cuentas Bancarias
        </h2>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-100">
              <tr>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">
                  Nombre de la Cuenta
                </th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">
                  Tipo de Cuenta
                </th>
                <th className="py-3 px-4 border-b border-blue-300 text-left text-sm font-semibold text-blue-900">
                  Número de Cuenta
                </th>
                <th className="py-3 px-4 border-b border-blue-300 text-right text-sm font-semibold text-blue-900">                  Monto Inicial
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                    {account.accountName}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                    {account.accountType}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800">
                    {account.accountNumber}
                  </td>
                  <td className="py-3 px-4 border-b border-blue-200 text-sm text-gray-800 text-right">
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
