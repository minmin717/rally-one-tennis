"use client";

import { useMemo, useState } from "react";

type Dimension = "reward" | "growth" | "control" | "manager" | "team" | "energy" | "fit" | "readiness";
type Sector = "bigtech" | "state" | "public" | "small" | "other";

const dimensions: Record<Dimension, { label: string; color: string }> = {
  reward: { label: "回报匹配", color: "#e28431" }, growth: { label: "成长空间", color: "#278f75" },
  control: { label: "自主边界", color: "#7c63e8" }, manager: { label: "管理体验", color: "#e65b94" },
  team: { label: "团队氛围", color: "#397cc8" }, energy: { label: "身心余量", color: "#ff6b4a" },
  fit: { label: "方向适配", color: "#a07518" }, readiness: { label: "离开准备", color: "#353535" },
};

const sectors: Record<Sector, { icon: string; name: string; hint: string; note: string }> = {
  bigtech: { icon: "🏙️", name: "大厂 / 大型民企", hint: "节奏快、平台成熟、绩效明确", note: "先判断是平台红利已经见顶，还是当前业务与直属管理的问题。" },
  state: { icon: "🏢", name: "国企 / 央企", hint: "稳定性高、协作链条长", note: "离开稳定平台的机会成本更高，优先验证内部转岗、换部门和发展通道。" },
  public: { icon: "📋", name: "体制内 / 事业单位", hint: "规则稳定、流动成本较高", note: "不要只用收入衡量去留，同时核算身份、地点、家庭预期与长期生活方式。" },
  small: { icon: "🚀", name: "中小公司 / 创业团队", hint: "变化快、职责边界弹性大", note: "重点区分短期波动和结构性风险，检查现金流、业务前景与能力沉淀。" },
  other: { icon: "🧩", name: "自由职业 / 其他", hint: "项目制、灵活或非典型路径", note: "把问题拆成客户质量、收入稳定性、工作方式和长期方向，而非简单地问要不要上班。" },
};

const questions: { text: string; dimension: Dimension; reverse?: boolean }[] = [
  { text: "把投入的时间和压力算进去，我认可现在的收入与福利。", dimension: "reward" },
  { text: "即使给我加薪20%，其他情况不变，我还是想离开。", dimension: "reward", reverse: true },
  { text: "这份工作的回报，能覆盖我现阶段最重要的生活目标。", dimension: "reward" },
  { text: "过去半年，我学到的能力换一个环境仍然有价值。", dimension: "growth" },
  { text: "继续待一年，我能说清自己会多得到什么。", dimension: "growth" },
  { text: "最近的工作大多只是重复，并没有让我更值钱。", dimension: "growth", reverse: true },
  { text: "我能决定自己如何完成任务，而不只是被动执行。", dimension: "control" },
  { text: "面对明显不合理的要求，我可以提出调整。", dimension: "control" },
  { text: "工作经常侵入休息时间，我却很难拒绝。", dimension: "control", reverse: true },
  { text: "直属领导能给出清晰目标和有效反馈。", dimension: "manager" },
  { text: "我与领导之间的问题，仍然可以通过沟通改善。", dimension: "manager" },
  { text: "我常因领导的情绪或反复变化而内耗。", dimension: "manager", reverse: true },
  { text: "我信任一起做事的同事，遇到问题能互相托底。", dimension: "team" },
  { text: "换到公司里的另一个团队，我愿意继续留下。", dimension: "team" },
  { text: "团队里的推诿、站队或低效协作让我疲惫。", dimension: "team", reverse: true },
  { text: "下班后，我通常还有精力过自己的生活。", dimension: "energy" },
  { text: "最近三个月，工作没有持续影响我的睡眠和情绪。", dimension: "energy" },
  { text: "一想到明天要工作，我就会产生明显的抗拒。", dimension: "energy", reverse: true },
  { text: "即使换一家公司，我仍愿意继续做同类工作。", dimension: "fit" },
  { text: "我能看见这条职业路径与自己想要的生活有关。", dimension: "fit" },
  { text: "我想离开的不只是公司，而是整个职业方向。", dimension: "fit", reverse: true },
  { text: "我已经开始了解外部机会、岗位或转型路径。", dimension: "readiness" },
  { text: "如果短期没有收入，我有一段可承受的缓冲期。", dimension: "readiness" },
  { text: "我想离开的念头已经持续超过三个月。", dimension: "readiness" },
];

const drainCopy: Record<Exclude<Dimension, "readiness">, { name: string; text: string }> = {
  reward: { name: "回报失衡", text: "你的投入与得到的东西正在失去平衡。" }, growth: { name: "成长停滞", text: "累不是核心，真正难受的是看不到积累。" },
  control: { name: "边界失控", text: "责任在增加，但决定权和个人空间没有同步增加。" }, manager: { name: "管理内耗", text: "直属管理方式正在放大日常工作的摩擦。" },
  team: { name: "关系消耗", text: "协作成本与不安全感占用了本该用于工作的精力。" }, energy: { name: "过载掉电", text: "身心余量已经不足，先恢复比仓促决定更重要。" },
  fit: { name: "方向错位", text: "你怀疑的不只是环境，而是这条路是否适合自己。" },
};

const strategies = {
  repair: { icon: "🧯", name: "留岗修复型", decision: "暂不急着离开，先用一个月修复工作方式", target: "工作节奏与边界", intro: "你对岗位本身并未失去认可，但持续消耗让判断变得悲观。先恢复精力、收紧边界，再做决定更可靠。", actions: ["列出三项最消耗你的重复事务，停止或简化其中一项", "约一次明确沟通，重新确认优先级和下班边界", "设置30天观察期，每周记录精力是否真实回升"] },
  negotiate: { icon: "🤝", name: "先谈条件型", decision: "值得留下，但不能再按现在的条件留下", target: "薪酬、权限或职责边界", intro: "核心问题更像交换条件失衡，而不是职业方向错误。一次有准备的谈判，可能比立刻换工作更划算。", actions: ["整理过去半年可量化的成果与新增职责", "明确你最想改变的一项条件及可接受底线", "设定谈判截止时间；没有实质改善再启动求职"] },
  team: { icon: "🔀", name: "换团队优先型", decision: "先换领导或团队，不必急着换掉整个赛道", target: "直属领导或协作环境", intro: "你对工作内容仍有认同，主要消耗集中在人和管理方式。能内部流动时，换团队通常比裸辞成本更低。", actions: ["了解内部转岗窗口与目标团队真实口碑", "与可信同事交叉验证：问题属于个人冲突还是团队机制", "为内部转岗设期限，同时低调更新外部机会"] },
  search: { icon: "🛶", name: "骑驴找马型", decision: "开始找下一份，但不建议情绪性裸辞", target: "当前公司与工作环境", intro: "留下的收益已经不足以抵消消耗，而你的离开准备还需要补齐。当前最优解是保住现金流、主动寻找出口。", actions: ["本周更新简历，只保留与目标岗位相关的成果", "每周固定投递与沟通，不用离职来逼自己行动", "先存够缓冲金，并写下接受新机会的三条底线"] },
  pivot: { icon: "🧭", name: "转岗探索型", decision: "先用低成本实验验证新岗位，再决定是否离开", target: "具体岗位，而非整家公司", intro: "你对当前工作内容的适配度在下降，但还没有足够证据说明要彻底换赛道。先试，再跳。", actions: ["选出两个相邻岗位，各访谈一位真实从业者", "用副项目、课程或内部任务做一次最小验证", "对比新旧岗位的日常，而不只比较想象中的优点"] },
  rethink: { icon: "🧭", name: "方向重估型", decision: "先重估职业方向，不要只是复制一份相似的工作", target: "职业方向与长期生活方式", intro: "你想逃离的可能不是某家公司，而是这类工作的核心日常。直接跳到同类岗位，很可能重复现在的困境。", actions: ["写下你想离开的具体日常，而不是笼统写“不喜欢”", "盘点三项可迁移能力和三种愿意尝试的工作场景", "用访谈与短项目验证方向，再制定6个月转型计划"] },
};

const options = ["很不符合", "不太符合", "比较符合", "非常符合"];

export default function Home() {
  const [stage, setStage] = useState<"landing" | "sector" | "quiz" | "result">("landing");
  const [sector, setSector] = useState<Sector | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const scores = useMemo(() => {
    const raw = Object.fromEntries(Object.keys(dimensions).map((key) => [key, 0])) as Record<Dimension, number>;
    questions.forEach((q, i) => raw[q.dimension] += q.reverse ? 3 - (answers[i] ?? 0) : (answers[i] ?? 0));
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.round((v / 9) * 100)])) as Record<Dimension, number>;
  }, [answers]);

  const healthKeys = Object.keys(drainCopy) as Exclude<Dimension, "readiness">[];
  const health = Math.round(healthKeys.reduce((sum, key) => sum + scores[key], 0) / healthKeys.length);
  const departure = Math.min(100, Math.max(0, Math.round((100 - health) * .72 + scores.readiness * .28)));
  const drains = [...healthKeys].sort((a, b) => scores[a] - scores[b]);
  const keeps = [...healthKeys].sort((a, b) => scores[b] - scores[a]).slice(0, 2);
  const strategyKey = (() => {
    if (scores.fit < 38) return "rethink";
    if (scores.fit < 52 || scores.growth < 38) return "pivot";
    if ((scores.manager < 42 || scores.team < 42) && scores.fit >= 55) return "team";
    if (departure >= 55 && scores.readiness >= 45) return "search";
    if ((scores.reward < 46 || scores.control < 42) && health >= 44) return "negotiate";
    return "repair";
  })() as keyof typeof strategies;
  const result = strategies[strategyKey];

  function answer(value: number) {
    const next = [...answers]; next[current] = value; setAnswers(next);
    if (current === questions.length - 1) setStage("result"); else setCurrent(current + 1);
  }
  function restart() { setStage("landing"); setSector(null); setCurrent(0); setAnswers([]); }
  async function share() {
    const text = `我的职场去留建议是「${result.name}」：${result.decision}。你该辞职，还是再撑一段时间？`;
    if (navigator.share) await navigator.share({ title: "职场去留定位测试", text, url: location.href });
    else { await navigator.clipboard.writeText(`${text} ${location.href}`); alert("结果文案已复制"); }
  }

  if (stage === "result" && sector) return <main className="page result-page">
    <section className="result-hero">
      <div className="eyebrow">你的当前去留建议 · {sectors[sector].name}</div><div className="result-icon">{result.icon}</div>
      <h1>{result.name}</h1><p className="result-subtitle">{result.decision}</p>
      <div className="decision-card"><div><span>离职倾向指数</span><b>{departure}<small>%</small></b></div><p>{result.intro}</p></div>
    </section>
    <section className="target-card"><span>你真正需要改变的，更可能是</span><h2>{result.target}</h2><p>{sectors[sector].note}</p></section>
    <section className="score-card"><h2>7项去留判断依据</h2>{healthKeys.map(key => <div className="score-row" key={key}><div className="score-label"><span>{dimensions[key].label}</span><b>{scores[key]}</b></div><div className="bar"><i style={{width:`${scores[key]}%`,background:dimensions[key].color}} /></div></div>)}</section>
    <section className="diagnosis-card"><div className="section-kicker">TOP 3 消耗来源</div><h2>你不是矫情，问题集中在这里</h2>{drains.slice(0,3).map((key,i)=><article key={key}><b>0{i+1}</b><div><h3>{drainCopy[key].name}</h3><p>{drainCopy[key].text}</p></div><strong>{scores[key]}</strong></article>)}</section>
    <section className="keep-card"><div className="section-kicker">还值得保留的部分</div><h2>{keeps.map(k=>dimensions[k].label).join(" · ")}</h2><p>做下一步选择时，不要只想着逃离，也要把这两项优势带到新方案里。</p></section>
    <section className="advice-card"><div className="section-kicker">未来30天行动清单</div><h2>先行动，再做不可逆决定</h2>{result.actions.map((x,i)=><div className="advice" key={x}><b>0{i+1}</b><p>{x}</p></div>)}</section>
    <section className="persona-card"><span>你的次要耗电类型</span><b>{drainCopy[drains[0]].name}</b><p>{drainCopy[drains[0]].text}</p></section>
    <section className="disclaimer">结果用于职业自我探索，不替代劳动法律、医疗或心理专业意见。若工作已持续影响健康或安全，请优先寻求现实支持。</section>
    <div className="sticky-actions"><button className="secondary" onClick={restart}>重新测试</button><button className="primary" onClick={share}>分享结果</button></div>
  </main>;

  if (stage === "quiz") {
    const progress = Math.round(((current + 1) / questions.length) * 100);
    return <main className="page quiz-page"><header className="quiz-header"><button className="back" onClick={()=>current?setCurrent(current-1):setStage("sector")}>←</button><span>{current+1} / {questions.length}</span><b>{progress}%</b></header><div className="progress"><i style={{width:`${progress}%`}} /></div><section className="question-card"><div className="question-number">{sector && sectors[sector].name} · QUESTION {String(current+1).padStart(2,"0")}</div><h1>{questions[current].text}</h1><p>按过去三个月的真实感受作答，不用选“应该怎样”。</p><div className="options">{options.map((option,index)=><button className={answers[current]===index?"selected":""} key={option} onClick={()=>answer(index)}><span>{String.fromCharCode(65+index)}</span>{option}</button>)}</div></section></main>;
  }

  if (stage === "sector") return <main className="page sector-page"><header className="quiz-header"><button className="back" onClick={()=>setStage("landing")}>←</button><span>第一步</span><b>环境分流</b></header><section className="sector-head"><div className="question-number">先校准你的工作环境</div><h1>你目前更接近哪种职场？</h1><p>同样是“想辞职”，在大厂、国企和体制内的机会成本完全不同。这个选择会影响最终建议。</p></section><div className="sector-options">{(Object.keys(sectors) as Sector[]).map(key=><button key={key} onClick={()=>{setSector(key);setStage("quiz")}}><i>{sectors[key].icon}</i><div><b>{sectors[key].name}</b><span>{sectors[key].hint}</span></div><strong>→</strong></button>)}</div></main>;

  return <main className="landing"><div className="grain"/><section className="hero"><div className="brand"><span>CAREER</span> DECISION LAB</div><div className="badge">约4分钟 · 24道题 · 6种行动策略</div><h1>你该辞职，<br/>还是再<span>撑一段时间</span>？</h1><p className="lead">不是替你冲动做决定，而是帮你看清：真正需要换掉的是条件、领导、团队、岗位，还是整个职业方向。</p><div className="type-cloud"><i>💰 回报</i><i>🌱 成长</i><i>🧑‍💼 领导</i><i>🪢 团队</i><i>🔋 身心消耗</i><i>🧳 离职准备</i></div><button className="start" onClick={()=>setStage("sector")}>开始去留定位 <span>→</span></button><small>先选择职场类型，获得更贴合现实环境的建议</small></section><section className="preview-card"><div><span>你将获得</span><b>一份可执行的去留判断</b></div><div className="mini-bars"><i/><i/><i/><i/></div><p>离职倾向指数 · 三大消耗源 · 改变目标 · 30天行动清单</p></section></main>;
}
