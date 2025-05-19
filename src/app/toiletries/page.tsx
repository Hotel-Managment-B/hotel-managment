"use client";

import dynamic from "next/dynamic";

const RegisterToiletries = dynamic(() => import("@/components/data/RegisterToiletries"), {
  ssr: false,
});

const ClientWrapper = () => {
    return <RegisterToiletries onProductAdded={() => {}} />;
};

export default ClientWrapper;