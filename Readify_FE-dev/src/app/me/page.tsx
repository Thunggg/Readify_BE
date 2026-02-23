"use server"

import { AccountApiRequest } from "@/api-request/account";
import { cookies } from "next/headers";
import MeInfo from "./Info";

export default async function MeProfile() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  return (
    <div>
      <h1>
        <MeInfo accessToken={accessToken ?? "ko tim thay"} />
      </h1>
    </div>
  );
}