import { redirect } from "next/navigation";
import { publicPaths } from "@/constants/path";

export default function Home() {
    redirect(publicPaths.HOME);
}
