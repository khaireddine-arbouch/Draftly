import Link from "next/link";
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
<div>
  <h1>Hello World</h1>
  <Link href="/hello" className="text-blue-500">Go to Hello</Link>
  <Button>Click me</Button>
</div>

);
}
