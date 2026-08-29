"use client";

import { useMemo, useState } from "react";

type Dimension = "reward" | "growth" | "control" | "manager" | "team" | "energy" | "fit" | "readiness";
type Sector = "bigtech" | "state" | "public" | "small" | "other";
type Choice = { label: string; value: number };

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
  { text: "把全年现金、稳定福利、雇主缴纳、工作时长与通勤成本折算后，你的综合回报处于什么位置？", dimension: "reward" },
  { text: "以过去三个月真实投入的总工时计算，你的有效时薪与同类机会相比如何？", dimension: "reward" },
  { text: "扣除固定生活成本后，目前工作每月能留下多少可支配结余？", dimension: "reward" },
  { text: "过去半年形成的成果，有多少能被下一家雇主直接识别和验证？", dimension: "growth" },
  { text: "公司承诺的发展机会，有多少已经落实为项目、职责、职级或收入变化？", dimension: "growth" },
  { text: "如果明年仍做相似工作，你在外部市场的议价能力预计会怎样变化？", dimension: "growth" },
  { text: "我能决定自己如何完成任务，而不只是被动执行。", dimension: "control" },
  { text: "面对明显不合理的要求，我可以提出调整。", dimension: "control" },
  { text: "工作经常侵入休息时间，我却很难拒绝。", dimension: "control", reverse: true },
  { text: "过去三次重要任务中，直属领导有几次提前明确目标、权限和验收标准？", dimension: "manager" },
  { text: "当你用事实提出资源或优先级问题后，领导的实际行为通常怎样变化？", dimension: "manager" },
  { text: "我常因领导的情绪或反复变化而内耗。", dimension: "manager", reverse: true },
  { text: "过去半年，团队核心成员流失、长期空缺或频繁换方向的情况如何？", dimension: "team" },
  { text: "换到公司里的另一个团队，我愿意继续留下。", dimension: "team" },
  { text: "团队里的推诿、站队或低效协作让我疲惫。", dimension: "team", reverse: true },
  { text: "过去四周，工作导致睡眠、就医、运动或重要关系被持续牺牲的频率是？", dimension: "energy" },
  { text: "休息两天或休假后，你的工作相关疲惫通常能恢复到什么程度？", dimension: "energy" },
  { text: "一想到明天要工作，我就会产生明显的抗拒。", dimension: "energy", reverse: true },
  { text: "去掉当前公司、领导和薪资因素，你是否仍愿意重复这个岗位最核心的日常？", dimension: "fit" },
  { text: "这条职业路径在收入上限、城市选择和生活节奏上，与长期目标匹配多少？", dimension: "fit" },
  { text: "我想离开的不只是公司，而是整个职业方向。", dimension: "fit", reverse: true },
  { text: "你对外部市场的判断，建立在多少份真实岗位、面试或从业者信息上？", dimension: "readiness" },
  { text: "扣除不可动用资金后，现金缓冲能覆盖多少个月的必要开支？", dimension: "readiness" },
  { text: "除存款外，你为离开准备了哪些可验证的退出条件？", dimension: "readiness" },
];

const evidenceChoices: Record<number, Choice[]> = {
  0: [{label:"没有完整算过，只看月薪",value:1},{label:"算过年收入，但没折算时间与稳定福利",value:1},{label:"完整折算后，低于可比岗位约15%以上",value:0},{label:"完整折算后，接近或高于可比岗位",value:3}],
  1: [{label:"没有记录工时，也没有可比数据",value:1},{label:"明显低于同经验同城市岗位",value:0},{label:"大致处于市场中间水平",value:2},{label:"高于市场，或时间自主性明显更好",value:3}],
  2: [{label:"经常入不敷出或需要借贷",value:0},{label:"结余不足必要开支的10%",value:1},{label:"可结余必要开支的10%—30%",value:2},{label:"可稳定结余30%以上",value:3}],
  3: [{label:"没有可展示成果",value:0},{label:"有经历，但很难量化或验证",value:1},{label:"有1—2项可验证成果",value:2},{label:"已有多项成果获得外部认可",value:3}],
  4: [{label:"基本停留在口头承诺",value:0},{label:"偶尔给机会，但没有明确标准",value:1},{label:"部分兑现，路径基本清楚",value:2},{label:"持续兑现，且已有明确结果",value:3}],
  5: [{label:"会下降：技能更封闭或过时",value:0},{label:"大概率不变",value:1},{label:"会积累一项可迁移能力",value:2},{label:"会形成稀缺能力或关键履历",value:3}],
  9: [{label:"0次，主要靠事后猜测",value:0},{label:"1次",value:1},{label:"2次",value:2},{label:"3次都有明确约定",value:3}],
  10: [{label:"没有变化，甚至产生负面后果",value:0},{label:"口头接受，但行动不变",value:1},{label:"部分问题得到调整",value:2},{label:"能稳定根据事实调整",value:3}],
  12: [{label:"持续流失或长期缺人",value:0},{label:"有明显波动，原因不透明",value:1},{label:"偶有流动，不影响核心协作",value:2},{label:"核心团队稳定且能补位",value:3}],
  15: [{label:"每周3次以上",value:0},{label:"每周1—2次",value:1},{label:"每月偶尔发生",value:2},{label:"几乎没有持续牺牲",value:3}],
  16: [{label:"休息后仍无法恢复",value:0},{label:"只能短暂缓解",value:1},{label:"大部分可以恢复",value:2},{label:"可以充分恢复",value:3}],
  18: [{label:"完全不愿意",value:0},{label:"只愿保留少部分工作内容",value:1},{label:"多数核心日常仍能接受",value:2},{label:"仍愿长期深耕",value:3}],
  19: [{label:"三项都明显冲突",value:0},{label:"两项冲突",value:1},{label:"只有一项需要妥协",value:2},{label:"三项基本匹配",value:3}],
  21: [{label:"主要来自想象或社交媒体",value:0},{label:"看过一些岗位，但未核实",value:1},{label:"核实过5份以上岗位或3位从业者",value:2},{label:"已有面试、offer或真实项目验证",value:3}],
  22: [{label:"不足1个月",value:0},{label:"1—3个月",value:1},{label:"3—6个月",value:2},{label:"6个月以上",value:3}],
  23: [{label:"还没有具体准备",value:0},{label:"只有模糊方向或简历",value:1},{label:"已有目标岗位、简历和行动计划",value:2},{label:"已有机会验证、缓冲资金和退出节点",value:3}],
};

const sectorQuestionText: Record<Sector, Record<number, string>> = {
  bigtech: {
    0: "把奖金/股权兑现、雇主缴纳、加班与通勤折算后，你的综合回报处于同级别岗位什么位置？",
    4: "继续留在当前业务一年，我还能获得可迁移的项目与能力增量。",
    8: "突发需求和即时响应经常侵入休息时间，我却很难拒绝。",
    9: "直属领导能给出稳定的绩效预期，而不是临近评估才改变标准。",
    13: "如果能转去更有前景的业务或团队，我愿意继续留在这家公司。",
    16: "最近三个月，高强度节奏没有持续影响我的睡眠和情绪。",
    18: "即使离开当前平台，我仍愿意继续做同类岗位。",
    21: "我已经开始了解外部级别、薪酬区间和真实岗位机会。",
  },
  state: {
    0: "把奖金、补贴、稳定福利、雇主缴纳和实际工时折算后，你的综合回报处于可比岗位什么位置？",
    4: "沿着现有发展通道再留一年，我能看到明确的能力或职级增长。",
    8: "流程、汇报和临时协调经常侵入个人时间，我却很难调整。",
    9: "直属领导能明确分工和评价标准，不会让我反复猜测。",
    13: "如果能内部换部门或岗位，我愿意继续留在这个平台。",
    16: "最近三个月，复杂协作与人情压力没有持续影响我的状态。",
    18: "即使失去当前平台的稳定性，我仍愿意继续做同类工作。",
    21: "我已经了解内部竞聘、调岗与外部求职的真实成本。",
  },
  public: {
    0: "把身份保障、雇主缴纳、补贴、收入上限与实际工时折算后，你的综合回报处于什么位置？",
    4: "按现有路径再留一年，我能看到专业能力或发展空间的增长。",
    8: "临时事务、人情协调或隐形要求经常侵入生活，我却很难拒绝。",
    9: "直属领导的任务安排和评价方式相对清晰、稳定。",
    13: "如果能调岗、借调或换科室，我愿意继续留在体系内。",
    16: "最近三个月，工作氛围没有持续影响我的睡眠与家庭生活。",
    18: "即使离开现有身份保障，我仍愿意继续做相近的公共服务工作。",
    21: "我已经认真核算过离开身份、地点与家庭预期的现实成本。",
  },
  small: {
    0: "把奖金兑现、潜在股权、业务风险、职责范围与实际工时折算后，你的综合回报处于什么位置？",
    4: "即使公司变化很快，我仍能持续积累可迁移的核心能力。",
    8: "因为人少事多，我经常无边界地承接职责外任务。",
    9: "创始人或直属领导的方向相对稳定，承诺与行动基本一致。",
    13: "如果业务更稳定、分工更清楚，我愿意继续留在这里。",
    16: "最近三个月，业务不确定性没有持续影响我的睡眠和情绪。",
    18: "即使公司最终没有成功，我仍认可自己正在做的这类工作。",
    21: "我已经了解公司现金流、业务前景和外部同类岗位机会。",
  },
  other: {
    0: "扣除获客、设备、空档期和保障成本，再折算实际工时后，你的净回报处于什么位置？",
    4: "继续当前工作方式一年，我能积累更稳定的客户、作品或能力。",
    8: "客户消息和项目节点经常侵入休息时间，我却很难设定边界。",
    9: "主要客户或合作方能给出相对明确、稳定的需求与反馈。",
    13: "如果能优化客户结构或合作方式，我愿意继续当前路径。",
    16: "最近三个月，收入与项目波动没有持续影响我的睡眠和情绪。",
    18: "即使换一批客户或合作方，我仍愿意继续做同类工作。",
    21: "我已经在测试新的客户来源、产品形式或职业选项。",
  },
};

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

const options: Choice[] = [{label:"很不符合",value:0},{label:"不太符合",value:1},{label:"比较符合",value:2},{label:"非常符合",value:3}];

export default function Home() {
  const [stage, setStage] = useState<"landing" | "sector" | "quiz" | "result">("landing");
  const [sector, setSector] = useState<Sector | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [choiceIndexes, setChoiceIndexes] = useState<number[]>([]);

  const activeQuestions = useMemo(() => questions.map((question, index) => ({
    ...question,
    text: sector ? (sectorQuestionText[sector][index] ?? question.text) : question.text,
  })), [sector]);

  const scores = useMemo(() => {
    const raw = Object.fromEntries(Object.keys(dimensions).map((key) => [key, 0])) as Record<Dimension, number>;
    activeQuestions.forEach((q, i) => raw[q.dimension] += q.reverse ? 3 - (answers[i] ?? 0) : (answers[i] ?? 0));
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.round((v / 9) * 100)])) as Record<Dimension, number>;
  }, [answers, activeQuestions]);

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

  function answer(value: number, choiceIndex: number) {
    const next = [...answers]; next[current] = value; setAnswers(next);
    const nextIndexes = [...choiceIndexes]; nextIndexes[current] = choiceIndex; setChoiceIndexes(nextIndexes);
    if (current === activeQuestions.length - 1) setStage("result"); else setCurrent(current + 1);
  }
  function restart() { setStage("landing"); setSector(null); setCurrent(0); setAnswers([]); setChoiceIndexes([]); }
  async function share() {
    if (!sector) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 2460;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const roundRect = (x:number,y:number,w:number,h:number,r:number,fill:string) => { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle=fill; ctx.fill(); };
    const wrap = (text:string,x:number,y:number,max:number,line:number,maxLines=9) => {
      const chars=[...text]; let row=""; let n=0;
      for (const char of chars) { const next=row+char; if(ctx.measureText(next).width>max){ctx.fillText(row,x,y+n*line);row=char;n++;if(n>=maxLines)return y+n*line;}else row=next; }
      if(row&&n<maxLines)ctx.fillText(row,x,y+n*line); return y+(n+1)*line;
    };
    const gradient=ctx.createLinearGradient(0,0,1080,2460); gradient.addColorStop(0,"#fff4e8");gradient.addColorStop(1,"#f3eadc");ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,2460);
    ctx.fillStyle="#20201f";ctx.font="800 28px Arial, sans-serif";ctx.fillText("CAREER DECISION LAB",72,78);
    ctx.fillStyle="#ff5b3d";ctx.font="700 25px Arial, sans-serif";ctx.fillText(`${sectors[sector].name} · 职场去留定位`,72,140);
    ctx.fillStyle="#20201f";ctx.font="900 82px Arial, sans-serif";ctx.fillText(result.name,72,255);
    ctx.fillStyle="#5f574f";ctx.font="700 35px Arial, sans-serif";wrap(result.decision,72,320,900,50,2);
    roundRect(72,420,936,245,32,"#20201f");ctx.fillStyle="#c9c0b6";ctx.font="700 25px Arial, sans-serif";ctx.fillText("离职倾向指数",112,475);
    ctx.fillStyle="#ff684b";ctx.font="900 112px Arial, sans-serif";ctx.fillText(String(departure),112,590);ctx.font="800 34px Arial, sans-serif";ctx.fillText("%",250,588);
    ctx.fillStyle="#ffffff";ctx.font="700 28px Arial, sans-serif";ctx.fillText("真正需要改变",500,490);ctx.font="900 44px Arial, sans-serif";wrap(result.target,500,555,430,55,2);
    ctx.fillStyle="#20201f";ctx.font="900 32px Arial, sans-serif";ctx.fillText("7项去留判断依据",72,735);
    healthKeys.forEach((key,i)=>{const y=775+i*72;ctx.fillStyle="#514a44";ctx.font="700 23px Arial, sans-serif";ctx.fillText(dimensions[key].label,72,y);ctx.textAlign="right";ctx.fillText(String(scores[key]),1008,y);ctx.textAlign="left";roundRect(265,y-19,670,18,9,"#e5ddd3");roundRect(265,y-19,Math.max(18,670*scores[key]/100),18,9,dimensions[key].color);});
    ctx.fillStyle="#20201f";ctx.font="900 32px Arial, sans-serif";ctx.fillText("你的三大消耗来源",72,1320);
    drains.slice(0,3).forEach((key,i)=>{const y=1360+i*145;roundRect(72,y,936,120,22,"#fffaf4");ctx.fillStyle="#ff5b3d";ctx.font="800 22px Arial, sans-serif";ctx.fillText(`0${i+1}`,102,y+52);ctx.fillStyle="#20201f";ctx.font="900 29px Arial, sans-serif";ctx.fillText(drainCopy[key].name,170,y+52);ctx.fillStyle="#6d655e";ctx.font="500 20px Arial, sans-serif";wrap(drainCopy[key].text,170,y+85,690,27,1);ctx.fillStyle="#20201f";ctx.font="900 29px Arial, sans-serif";ctx.textAlign="right";ctx.fillText(String(scores[key]),960,y+52);ctx.textAlign="left";});
    roundRect(72,1810,936,150,26,"#eaf8f1");ctx.fillStyle="#397666";ctx.font="700 21px Arial, sans-serif";ctx.fillText("还值得保留的部分",108,1855);ctx.fillStyle="#20201f";ctx.font="900 35px Arial, sans-serif";ctx.fillText(keeps.map(k=>dimensions[k].label).join(" · "),108,1905);ctx.fillStyle="#645e57";ctx.font="500 20px Arial, sans-serif";ctx.fillText("下一步选择时，也要把这些优势带进新方案。",108,1940);
    ctx.fillStyle="#20201f";ctx.font="900 32px Arial, sans-serif";ctx.fillText("未来30天行动清单",72,2035);
    ctx.font="600 22px Arial, sans-serif";ctx.fillStyle="#5f574f";result.actions.forEach((x,i)=>{roundRect(72,2070+i*78,42,42,12,"#ff5b3d");ctx.fillStyle="#fff";ctx.font="800 19px Arial, sans-serif";ctx.fillText(String(i+1),87,2098+i*78);ctx.fillStyle="#5f574f";ctx.font="600 22px Arial, sans-serif";wrap(x,135,2098+i*78,850,30,2);});
    roundRect(72,2320,936,82,20,"#fff0e8");ctx.fillStyle="#8a4c35";ctx.font="700 21px Arial, sans-serif";ctx.fillText("次要耗电类型",102,2370);ctx.fillStyle="#20201f";ctx.font="900 27px Arial, sans-serif";ctx.fillText(drainCopy[drains[0]].name,285,2370);
    ctx.fillStyle="#8a8177";ctx.font="500 18px Arial, sans-serif";ctx.fillText("结果用于职业自我探索，不替代劳动法律、医疗或心理专业意见。",72,2435);
    const blob = await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png",.94)); if(!blob)return;
    const file = new File([blob],`职场去留测试-${result.name}.png`,{type:"image/png"});
    const shareData={title:"职场去留定位测试",text:`我的去留建议是「${result.name}」`,files:[file]};
    if(navigator.share && (!navigator.canShare || navigator.canShare(shareData))) await navigator.share(shareData);
    else { const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
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
    <div className="sticky-actions"><button className="secondary" onClick={restart}>重新测试</button><button className="primary" onClick={share}>生成图片分享</button></div>
  </main>;

  if (stage === "quiz") {
    const progress = Math.round(((current + 1) / activeQuestions.length) * 100);
    const currentOptions = evidenceChoices[current] ?? options;
    return <main className="page quiz-page"><header className="quiz-header"><button className="back" onClick={()=>current?setCurrent(current-1):setStage("sector")}>←</button><span>{current+1} / {activeQuestions.length}</span><b>{progress}%</b></header><div className="progress"><i style={{width:`${progress}%`}} /></div><section className="question-card"><div className="question-number">{sector && sectors[sector].name} · QUESTION {String(current+1).padStart(2,"0")}</div><h1>{activeQuestions[current].text}</h1><p>{evidenceChoices[current] ? "尽量依据真实记录或可验证信息作答；不确定也是一种重要信号。" : "按过去三个月反复出现的事实作答，不用选“应该怎样”。"}</p><div className="options">{currentOptions.map((option,index)=><button className={choiceIndexes[current]===index?"selected":""} key={option.label} onClick={()=>answer(option.value,index)}><span>{String.fromCharCode(65+index)}</span>{option.label}</button>)}</div></section></main>;
  }

  if (stage === "sector") return <main className="page sector-page"><header className="quiz-header"><button className="back" onClick={()=>setStage("landing")}>←</button><span>第一步</span><b>环境分流</b></header><section className="sector-head"><div className="question-number">先校准你的工作环境</div><h1>你目前更接近哪种职场？</h1><p>同样是“想辞职”，在大厂、国企和体制内的机会成本完全不同。这个选择会影响最终建议。</p></section><div className="sector-options">{(Object.keys(sectors) as Sector[]).map(key=><button key={key} onClick={()=>{setSector(key);setStage("quiz")}}><i>{sectors[key].icon}</i><div><b>{sectors[key].name}</b><span>{sectors[key].hint}</span></div><strong>→</strong></button>)}</div></main>;

  return <main className="landing"><div className="grain"/><section className="hero"><div className="brand"><span>CAREER</span> DECISION LAB</div><div className="badge">约4分钟 · 24道题 · 6种行动策略</div><h1>你该辞职，<br/>还是再<span>撑一段时间</span>？</h1><p className="lead">不是替你冲动做决定，而是帮你看清：真正需要换掉的是条件、领导、团队、岗位，还是整个职业方向。</p><div className="type-cloud"><i>💰 回报</i><i>🌱 成长</i><i>🧑‍💼 领导</i><i>🪢 团队</i><i>🔋 身心消耗</i><i>🧳 离职准备</i></div><button className="start" onClick={()=>setStage("sector")}>开始去留定位 <span>→</span></button><small>先选择职场类型，获得更贴合现实环境的建议</small></section><section className="preview-card"><div><span>你将获得</span><b>一份可执行的去留判断</b></div><div className="mini-bars"><i/><i/><i/><i/></div><p>离职倾向指数 · 三大消耗源 · 改变目标 · 30天行动清单</p></section></main>;
}
