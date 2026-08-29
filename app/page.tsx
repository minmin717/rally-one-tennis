"use client";

import { useMemo, useState } from "react";

type Dimension = "energy" | "autonomy" | "growth" | "social" | "meaning" | "boundary";

const dimensions: Record<Dimension, { label: string; color: string }> = {
  energy: { label: "抗压续航", color: "#ff6b4a" },
  autonomy: { label: "自主掌控", color: "#7c63e8" },
  growth: { label: "成长驱动", color: "#278f75" },
  social: { label: "协作连接", color: "#e65b94" },
  meaning: { label: "意义感", color: "#d29a21" },
  boundary: { label: "边界意识", color: "#397cc8" },
};

const questions: { text: string; dimension: Dimension; reverse?: boolean }[] = [
  { text: "临时被通知今晚要加班，我还能快速调整状态。", dimension: "energy" },
  { text: "连续开会和处理消息后，我需要独处很久才能恢复。", dimension: "energy", reverse: true },
  { text: "忙碌的一周结束后，我通常还有精力安排自己的生活。", dimension: "energy" },
  { text: "比起明确流程，我更喜欢自己决定怎么完成任务。", dimension: "autonomy" },
  { text: "当领导频繁过问细节时，我会明显烦躁。", dimension: "autonomy" },
  { text: "即使目标模糊，我也能主动拆解并推进事情。", dimension: "autonomy" },
  { text: "如果半年没有学到新东西，我会认真考虑换环境。", dimension: "growth" },
  { text: "我愿意为了能力提升，短期承担更难的任务。", dimension: "growth" },
  { text: "我经常复盘：这件事有没有让我变得更值钱。", dimension: "growth" },
  { text: "和靠谱的人一起做事，会显著提升我的工作状态。", dimension: "social" },
  { text: "我擅长感知团队气氛，并调整自己的沟通方式。", dimension: "social" },
  { text: "工作中的认可和连接，对我和薪资一样重要。", dimension: "social" },
  { text: "知道工作正在帮助谁，会让我更有动力。", dimension: "meaning" },
  { text: "只要钱到位，做什么内容对我都没有区别。", dimension: "meaning", reverse: true },
  { text: "我希望自己的工作能留下某种长期价值。", dimension: "meaning" },
  { text: "下班后的非紧急消息，我可以安心第二天再回。", dimension: "boundary" },
  { text: "当任务明显超出职责时，我能清楚表达并协商。", dimension: "boundary" },
  { text: "我不会因为拒绝不合理要求而长时间内疚。", dimension: "boundary" },
];

const resultTypes: Record<Dimension, { icon: string; name: string; subtitle: string; truth: string; strengths: string[]; drains: string[]; advice: string[] }> = {
  energy: {
    icon: "⚡", name: "高能冲刺者", subtitle: "关键时刻能顶上，但别把救火当日常",
    truth: "你对压力的耐受度高，越到关键节点越容易进入状态。别人眼里的混乱，对你可能反而是一种刺激。",
    strengths: ["紧急任务反应快", "复杂局面不容易慌", "能带动团队行动"],
    drains: ["长期低强度消耗", "反复救同一种火", "努力被当作理所当然"],
    advice: ["把冲刺能力留给真正重要的节点", "每月安排至少一个无工作恢复日", "用流程解决重复救火，而不是继续硬扛"],
  },
  autonomy: {
    icon: "🧭", name: "自主掌舵者", subtitle: "你不是难管理，你只是需要方向而非遥控",
    truth: "你最在意的不是轻松，而是拥有决定怎么做的空间。清晰目标加充分授权，是你发挥最好的环境。",
    strengths: ["自驱推进能力强", "能从模糊中找到路径", "愿意为结果负责"],
    drains: ["事无巨细的汇报", "反复被改执行方式", "责任很大但没有权限"],
    advice: ["接任务时先确认目标和决策边界", "用阶段成果换取更多授权", "避开强控制、低信任的团队"],
  },
  growth: {
    icon: "🌱", name: "升级型玩家", subtitle: "你怕的不是累，是原地重复",
    truth: "成长感是你的主要燃料。只要看得见能力积累，你可以接受难度；真正让你耗尽的是毫无增量的重复。",
    strengths: ["学习速度快", "愿意挑战舒适区", "能把经验沉淀成方法"],
    drains: ["长期做低价值重复工作", "晋升标准模糊", "只有承诺没有反馈"],
    advice: ["每季度盘点可迁移能力", "选择能获得高质量反馈的人", "换工作前先判断问题是岗位还是学习方式"],
  },
  social: {
    icon: "🪢", name: "关系增幅器", subtitle: "好的同事让你超常发挥，坏的氛围让你迅速掉电",
    truth: "你对人和氛围的感知很敏锐。信任、认可和协作会放大你的能力，而冷漠内耗的关系成本也会被你成倍感受到。",
    strengths: ["协作意识强", "能捕捉团队情绪", "擅长促成共识"],
    drains: ["办公室政治", "长期单打独斗", "付出得不到回应"],
    advice: ["面试时重点反向了解直属团队", "区分共情和替别人负责", "建立工作之外的稳定支持系统"],
  },
  meaning: {
    icon: "🔭", name: "意义寻路者", subtitle: "你需要的不只是工资到账，还有“为什么做”",
    truth: "你很难长期投入一件自己不认同的事。看见用户、价值和长期影响时，你的专注力会明显上升。",
    strengths: ["责任感和投入度高", "关注长期价值", "能用愿景感染他人"],
    drains: ["价值观冲突", "只追数字不讲原因", "工作成果无人真正需要"],
    advice: ["把宏大意义拆成可见的小反馈", "别用热爱替公司补贴成本", "优先选择产品和用户价值清晰的岗位"],
  },
  boundary: {
    icon: "🛡️", name: "边界守门员", subtitle: "你最珍贵的职场能力，是不让工作吞掉生活",
    truth: "你对职责、公平和个人空间有清晰感知。你并不缺责任心，只是不愿意用无限让步证明价值。",
    strengths: ["风险意识清楚", "沟通直接稳定", "能保持长期工作节奏"],
    drains: ["隐形加班文化", "职责不断漂移", "用情绪绑架责任感"],
    advice: ["拒绝时同步给出可行替代方案", "保留关键职责变更记录", "寻找尊重规则、预期明确的团队"],
  },
};

const options = ["很不符合", "不太符合", "比较符合", "非常符合"];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const scores = useMemo(() => {
    const raw = Object.fromEntries(Object.keys(dimensions).map((key) => [key, 0])) as Record<Dimension, number>;
    questions.forEach((question, index) => {
      const answer = answers[index] ?? 0;
      raw[question.dimension] += question.reverse ? 3 - answer : answer;
    });
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Math.round((value / 9) * 100)])) as Record<Dimension, number>;
  }, [answers]);

  const primary = (Object.keys(scores) as Dimension[]).sort((a, b) => scores[b] - scores[a])[0];
  const result = resultTypes[primary];

  function answer(value: number) {
    const next = [...answers];
    next[current] = value;
    setAnswers(next);
    if (current === questions.length - 1) setShowResult(true);
    else setCurrent(current + 1);
  }

  function restart() {
    setStarted(false); setCurrent(0); setAnswers([]); setShowResult(false);
  }

  async function share() {
    const text = `我的职场耗电人格是「${result.name}」：${result.subtitle}。你是哪一种？`;
    if (navigator.share) await navigator.share({ title: "职场耗电人格测试", text, url: window.location.href });
    else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); alert("结果文案已复制"); }
  }

  if (showResult) {
    return (
      <main className="page result-page">
        <section className="result-hero">
          <div className="eyebrow">你的职场耗电人格</div>
          <div className="result-icon">{result.icon}</div>
          <h1>{result.name}</h1>
          <p className="result-subtitle">{result.subtitle}</p>
          <div className="truth-card"><span>一句真相</span><p>{result.truth}</p></div>
        </section>

        <section className="score-card">
          <h2>你的职场能量图谱</h2>
          {(Object.keys(dimensions) as Dimension[]).map((key) => (
            <div className="score-row" key={key}>
              <div className="score-label"><span>{dimensions[key].label}</span><b>{scores[key]}</b></div>
              <div className="bar"><i style={{ width: `${scores[key]}%`, background: dimensions[key].color }} /></div>
            </div>
          ))}
        </section>

        <section className="two-column">
          <article className="list-card mint"><h2>你的隐藏优势</h2>{result.strengths.map((x) => <p key={x}>✓ {x}</p>)}</article>
          <article className="list-card peach"><h2>最容易被耗电</h2>{result.drains.map((x) => <p key={x}>⚠ {x}</p>)}</article>
        </section>

        <section className="advice-card"><div className="section-kicker">给你的行动建议</div><h2>别急着辞职，先改变耗电方式</h2>{result.advice.map((x, i) => <div className="advice" key={x}><b>0{i + 1}</b><p>{x}</p></div>)}</section>

        <section className="disclaimer">本测试用于娱乐与自我探索，不构成职业、心理或医疗建议。结果描述的是偏好，不是能力高低。</section>
        <div className="sticky-actions"><button className="secondary" onClick={restart}>重新测试</button><button className="primary" onClick={share}>分享结果</button></div>
      </main>
    );
  }

  if (started) {
    const progress = Math.round(((current + 1) / questions.length) * 100);
    return (
      <main className="page quiz-page">
        <header className="quiz-header"><button className="back" onClick={() => current ? setCurrent(current - 1) : setStarted(false)}>←</button><span>{current + 1} / {questions.length}</span><b>{progress}%</b></header>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        <section className="question-card">
          <div className="question-number">QUESTION {String(current + 1).padStart(2, "0")}</div>
          <h1>{questions[current].text}</h1>
          <p>跟随第一反应，不用想太久</p>
          <div className="options">{options.map((option, index) => <button className={answers[current] === index ? "selected" : ""} key={option} onClick={() => answer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="landing">
      <div className="grain" />
      <section className="hero">
        <div className="brand"><span>OFFICE</span> ENERGY LAB</div>
        <div className="badge">3分钟 · 18道题 · 6种人格</div>
        <h1>你不是不努力，<br />只是工作的<span>耗电方式</span><br />不适合你。</h1>
        <p className="lead">测出你的职场耗电人格，找到真正让你掉电的工作模式。</p>
        <div className="type-cloud"><i>⚡ 高能冲刺</i><i>🧭 自主掌舵</i><i>🌱 升级玩家</i><i>🪢 关系增幅</i><i>🔭 意义寻路</i><i>🛡️ 边界守门</i></div>
        <button className="start" onClick={() => setStarted(true)}>开始测试 <span>→</span></button>
        <small>已有 1,284 位打工人找到自己的耗电开关 · 演示数据</small>
      </section>
      <section className="preview-card"><div><span>你将获得</span><b>完整能量图谱</b></div><div className="mini-bars"><i /><i /><i /><i /></div><p>人格解读 · 隐藏优势 · 耗电雷区 · 行动建议</p></section>
    </main>
  );
}
