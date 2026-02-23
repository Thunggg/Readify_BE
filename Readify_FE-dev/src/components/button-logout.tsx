"use client"

import { authApiRequest } from "@/api-request/auth";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { handleErrorApi } from "@/lib/utils";

export default function ButtonLogout() {
    const router = useRouter();
    const handleLogout = async () => {
        try {
            await authApiRequest.logoutFromNextClientToServer();
            router.push("/login");
        } catch (error) {
            handleErrorApi({error, duration: 5000});
        }
    }
    return (
        <Button onClick={() => handleLogout()}>Logout</Button>
    )
}