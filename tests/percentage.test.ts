import { calculate, parseNumber, fmt, type PercentMode } from "../src/lib/percentage";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};
const disp = (m: PercentMode, a: string, b: string) => {
  const o = calculate(m, a, b);
  return o.status === "ok" ? o.result.display : o.status;
};

eq("20% of 500", disp("of", "20", "500"), "100");
eq("50 is ?% of 200", disp("what", "50", "200"), "25%");
eq("increase 100→150", disp("increase", "100", "150"), "50%");
eq("decrease 200→150", disp("decrease", "200", "150"), "25%");
eq("difference 40/60", disp("difference", "40", "60"), "40%");
eq("discount 80 @25%", disp("discount", "80", "25"), "60");
eq("decimals 12.5% of 80.4", disp("of", "12.5", "80.4"), "10.05");
eq("float noise 0.1+0.2 style", disp("of", "10", "3"), "0.3");
eq("1/3 precision", disp("what", "1", "3"), "33.333333%");
eq("thousands separators", disp("of", "15", "1,250,000"), "187,500");
eq("decimal comma", parseNumber("12,5"), { kind: "ok", value: 12.5 });
eq("percent sign", parseNumber("20%"), { kind: "ok", value: 20 });
eq("unicode minus", parseNumber("−5"), { kind: "ok", value: -5 });
eq("invalid text", calculate("of", "abc", "5").status, "error");
eq("empty", calculate("of", "", "5").status, "empty");
eq("what: divide by zero", calculate("what", "5", "0").status, "error");
eq("increase from zero", calculate("increase", "0", "5").status, "error");
eq("difference avg zero", calculate("difference", "5", "-5").status, "error");
eq("negative discount rejected", calculate("discount", "-10", "5").status, "error");
eq("zero of anything", disp("of", "0", "999"), "0");
eq("increase mode, value fell → negative", disp("increase", "200", "150"), "-25%");
const n = calculate("increase", "200", "150");
eq("wrong-direction note present", n.status === "ok" && Boolean(n.result.note), true);
eq("negative original uses |x|", disp("increase", "-50", "-25"), "50%");
eq("no NaN/Infinity ever", ["of", "what", "increase", "decrease", "difference", "discount"].every((m) =>
  ["0", "-0", "1e308", "1e-12", "5"].every((a) => ["0", "1e308", "-3", "7"].every((b) => {
    const o = calculate(m as PercentMode, a, b);
    return o.status !== "ok" || !/NaN|Infinity/.test(o.result.display + o.result.steps.join() + o.result.sentence);
  }))), true);
eq("fmt -0", fmt(-0), "0");
if (fails) process.exitCode = 1;
