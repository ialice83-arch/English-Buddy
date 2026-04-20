"use client";
import { useState } from "react";

/**
 * English Buddy - 세련된 다크 블루 테마 영어 학습 앱
 *
 * 주요 기능:
 * - AI 영어 비서 ([교정], [번역] 기능 제공)
 * - "교정": 문법 수정+이유(한글 친절 설명) 카드
 * - "번역": 표준/쉬운/원어민 버전 3번역 카드
 * - 다크 네이비(#101530)/블루(#2046B3) 기반 테마
 */

type CorrectionResult = {
  corrected: string;
  reason: string;
};
type TranslationResult = {
  standard: string;
  simple: string;
  native: string;
};

// 코드에 직접 입력한 OpenAI API Key 사용
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [correction, setCorrection] = useState<CorrectionResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OpenAI API 호출 함수
  async function callOpenAI(messages: any[]) {
    if (!OPENAI_API_KEY) throw new Error("OpenAI API Key가 입력되지 않았습니다!");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      let message = data?.error?.message || "OpenAI API 호출에 실패했습니다.";
      if (res.status === 401) message = "잘못된 OpenAI API Key입니다.";
      throw new Error(message);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content;
  }

  const handleCorrection = async () => {
    setError(null);
    setLoading(true);
    setTranslation(null);

    if (!input.trim()) {
      setCorrection(null);
      setLoading(false);
      return;
    }
    if (!OPENAI_API_KEY) {
      setLoading(false);
      setError("OpenAI API Key가 코드에 없습니다.");
      return;
    }

    try {
      const systemPrompt = `이제부터 입력받은 한글 또는 영어 문장의 문법 오류를 교정해주고, "수정된 문장"과 "수정 이유"(한글로 상세히, 친절히 설명)를 답변해줘. 영어 문장의 경우 한글로 설명해줘. 반드시 아래 형태의 JSON 텍스트 그대로만 답변해:\n{"corrected": "(수정된 문장)", "reason": "(수정 이유: 한글로 설명)"}`;
      const userPrompt = input.trim();

      const content = await callOpenAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
      let json: CorrectionResult | null = null;
      try {
        json = JSON.parse(content ?? "");
      } catch {
        setError("AI 응답 파싱에 실패했습니다. 다시 시도하거나 문장을 다르게 입력해보세요.");
        setCorrection(null);
        setLoading(false);
        return;
      }
      setCorrection(json);
    } catch (err: any) {
      setCorrection(null);
      setError(typeof err === "string" ? err : err.message || "에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleTranslation = async () => {
    setError(null);
    setLoading(true);
    setCorrection(null);

    if (!input.trim()) {
      setTranslation(null);
      setLoading(false);
      return;
    }
    if (!OPENAI_API_KEY) {
      setLoading(false);
      setError("OpenAI API Key가 코드에 없습니다.");
      return;
    }
    try {
      const systemPrompt = `입력받은 문장을 Standard, Simple, Native 3가지 버전으로 번역해줘.\n- 영어 입력이면 한국어 번역(표준/쉬운/자연스러운 원어민식)\n- 한글 입력이면 영어 번역(표준/쉬운/자연스러운 원어민식)\n다음의 JSON 텍스트 형식으로만 답을 작성해:\n{"standard": "(번역: 표준)", "simple": "(번역: 쉬운)", "native": "(번역: 원어민 자연스럽게)"}`;
      const userPrompt = input.trim();

      const content = await callOpenAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
      let json: TranslationResult | null = null;
      try {
        json = JSON.parse(content ?? "");
      } catch {
        setError("AI 응답 파싱에 실패했습니다. 다시 시도하거나 문장을 다르게 입력해보세요.");
        setTranslation(null);
        setLoading(false);
        return;
      }
      setTranslation(json);
    } catch (err: any) {
      setTranslation(null);
      setError(typeof err === "string" ? err : err.message || "에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101530] flex flex-col items-center font-sans transition-colors duration-300">
      <main className="w-full max-w-xl flex flex-col px-4 pt-12 pb-8">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#39A0FF] text-center mb-2 drop-shadow-xl tracking-tight select-none">
          English Buddy
        </h1>
        <div className="text-lg font-medium text-[#D3E6FF] text-center mb-10 tracking-wider select-none opacity-80">
          AI-powered English Correction & Translation
        </div>

        {/* 입력 */}
        <textarea
          className="w-full min-h-[110px] resize-y p-4 text-lg border-2 border-[#22336e]/60 rounded-xl bg-[#162044] text-white placeholder-[#9ae5ff99] focus:border-[#39A0FF] focus:outline-none shadow-lg mb-6 transition-all"
          placeholder="영어 또는 한국어 문장을 입력하세요. (자동 인식)"
          value={input}
          disabled={loading}
          onChange={e => {
            setInput(e.target.value);
            setCorrection(null);
            setTranslation(null);
            setError(null);
          }}
        />

        {/* 에러 메시지 */}
        {error && (
          <div className="w-full text-center text-[#ff3d6f] font-semibold mb-4">{error}</div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4 mb-10">
          <button
            className="flex-1 py-3 bg-gradient-to-r from-[#2046B3] to-[#39A0FF] hover:from-[#152963] hover:to-[#257bbf] text-white rounded-lg font-bold text-lg shadow-md transition-all duration-150 disabled:bg-[#22336e] disabled:opacity-60"
            disabled={!input.trim() || loading}
            onClick={handleCorrection}
          >
            교정
          </button>
          <button
            className="flex-1 py-3 border-2 border-[#39A0FF] text-[#39A0FF] bg-[#152963]/40 hover:bg-[#22336e] rounded-lg font-bold text-lg shadow-md transition-all duration-150 disabled:border-[#22336e] disabled:text-[#537fc9] disabled:bg-transparent disabled:opacity-60"
            disabled={!input.trim() || loading}
            onClick={handleTranslation}
          >
            번역
          </button>
        </div>

        {/* 결과 영역 */}
        <div className="min-h-[140px]">
          {loading && (
            <div className="w-full text-center text-[#39A0FF] font-semibold my-8 animate-pulse">
              처리 중입니다...
            </div>
          )}

          {/* Correction Result */}
          {correction && (
            <div className="w-full bg-[#181f3a]/80 border border-[#39A0FF]/40 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur">
              <h2 className="text-xl font-semibold text-[#39A0FF] mb-3 tracking-wide">교정 결과</h2>
              <p className="mb-3 text-[#d0e4ff] leading-relaxed">
                <span className="font-bold text-[#6fc5ff]">수정 문장:</span><br />
                {correction.corrected}
              </p>
              <div className="bg-[#152963]/80 rounded px-4 py-3 text-[#c9e2ff] text-base">
                <span className="font-bold text-[#39A0FF]">수정 이유:</span>{" "}
                {correction.reason}
              </div>
            </div>
          )}

          {/* Translation Result */}
          {translation && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#181f3a]/80 border border-[#39A0FF]/20 rounded-xl p-5 shadow backdrop-blur">
                <h2 className="text-base font-semibold text-[#39A0FF] mb-1">① Standard</h2>
                <p className="text-[#d0e4ff]">{translation.standard}</p>
              </div>
              <div className="bg-[#181f3a]/80 border border-[#39A0FF]/20 rounded-xl p-5 shadow backdrop-blur">
                <h2 className="text-base font-semibold text-[#39A0FF] mb-1">② Simple</h2>
                <p className="text-[#d0e4ff]">{translation.simple}</p>
              </div>
              <div className="bg-[#181f3a]/80 border border-[#39A0FF]/20 rounded-xl p-5 shadow backdrop-blur">
                <h2 className="text-base font-semibold text-[#39A0FF] mb-1">③ Native</h2>
                <p className="text-[#d0e4ff]">{translation.native}</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="w-full pt-4 pb-2 text-center text-xs text-[#6b8fc9] opacity-50 select-none">
        &copy; {new Date().getFullYear()} English Buddy. Powered by OpenAI.
      </footer>
    </div>
  );
}
