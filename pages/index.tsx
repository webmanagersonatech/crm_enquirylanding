// src/pages/index.tsx
import OnlineEnquiryForm from "@/components/OnlineenquiryForm";
import { GetServerSideProps } from "next";

type Props = {
  instituteId: string | null;
};



export default function LoginPage({ instituteId }: Props) {
  console.log(instituteId,"instituteIdxxx")
  return (
    <div >
      <OnlineEnquiryForm instituteId={instituteId} />
    </div>
  );
}

// This function runs on the server
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // Read cookie from request
  const instituteId = req.cookies["instituteId"] || null;

  return {
    props: { instituteId },
  };
};
