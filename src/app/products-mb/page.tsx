"use client";

import dynamic from "next/dynamic";

const RegisterProducts = dynamic(() => import("@/components/data/RegisterProducts"), {
  ssr: false,
});

const ClientWrapper = () => {
    return <RegisterProducts onProductAdded={() => {}} />;
};

export default ClientWrapper;