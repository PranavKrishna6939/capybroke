export const metadata = {
  title: "Roast My Portfolio - AI-Powered Stock Portfolio Analysis",
  description: "Get your stock portfolio roasted with humor and insight. Enter your tickers and discover what our AI really thinks about your investment choices.",
};

import PageIllustration from "@/components/page-illustration";
import ChatInterface from "@/components/chat-interface";

export default function Home() {
  return (
    <>
      <PageIllustration />
      <ChatInterface />
    </>
  );
}