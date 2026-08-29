"use client";

import { useState } from "react";

type Screen = "home" | "setup" | "camera" | "check" | "recording" | "analysis" | "detail";

const cameraGuides = {
  "后方": { title: "底线正后方", distance: "4–6m", height: "1.2–1.5m", lens: "0.5×", note: "适合看落点、回位和左右移动。手机与底线中点对齐，避免偏向正手或反手侧。" },
  "侧方": { title: "底线侧方", distance: "3–4m", height: "1.0–1.2m", lens: "0.5×", note: "适合看击球点、引拍和重心转移。镜头朝向击球区，不要正对发球机。" },
  "斜后方": { title: "底线斜后方 45°", distance: "4–5m", height: "1.2–1.4m", lens: "0.5×", note: "兼顾挥拍动作与来球线路。手机放在惯用手相反一侧，更少被身体遮挡。" },
} as const;

const steps = [
  { n: "01", title: "架机", sub: "先让 AI 看得清" },
  { n: "02", title: "开练", sub: "自动切分每一拍" },
  { n: "03", title: "复盘", sub: "只改最关键的一件事" },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [side, setSide] = useState<keyof typeof cameraGuides>("后方");
  const [focus, setFocus] = useState("正手稳定性");
  const [saved, setSaved] = useState(false);

  const back = () => setScreen(screen === "camera" ? "setup" : screen === "setup" ? "home" : "analysis");

  if (screen === "setup") return <Shell title="开始训练" onBack={() => setScreen("home")}>
    <div className="step-line"><i/><b>训练设置</b><span>约 30 秒</span></div>
    <h1 className="screen-title">今天想练什么？</h1>
    <p className="muted">选一个重点。练完后，我们会围绕它给出反馈。</p>
    <div className="focus-grid">
      {["正手稳定性","反手稳定性","击球点","步伐与还原","发球","随便练练"].map((x,i)=><button key={x} onClick={()=>setFocus(x)} className={focus===x?"active":""}><span>{["↗","↖","◎","⌁","↑","✦"][i]}</span>{x}</button>)}
    </div>
    <label className="field-label">你的惯用手</label>
    <div className="segmented"><button className="active">右手</button><button>左手</button></div>
    <label className="field-label">球源</label>
    <div className="segmented"><button className="active">发球机</button><button>墙练</button><button>自抛球</button></div>
    <button className="cta" onClick={()=>setScreen("camera")}>下一步 · 架好手机 <b>→</b></button>
  </Shell>;

  if (screen === "camera") return <Shell title="架机助手" onBack={back} dark>
    <div className="camera-stage">
      <div className="court-wrap"><span className="court-caption">标准网球场 · 俯视图</span><div className="court"><div className="singles singles-left"/><div className="singles singles-right"/><div className="service service-far"/><div className="service service-near"/><div className="center-service"/><div className="net"/><div className="player"><span className="head"/><span className="body"/><span className="arms"/><span className="legs"/><em>击球者</em></div></div><div className={`phone ${side}`}><b>▯</b><span>手机</span></div></div>
      <div className="camera-ok pending"><i>1</i><div><b>按图放到推荐位置</b><span>确认手机稳定、镜头无遮挡即可开始</span></div></div>
    </div>
    <div className="sheet">
      <div className="sheet-handle"/>
      <div className="angle-tabs">{["后方","侧方","斜后方"].map(x=><button key={x} onClick={()=>setSide(x)} className={side===x?"active":""}>{x}</button>)}</div>
      <h2>{cameraGuides[side].title}</h2>
      <div className="measurements"><div><b>{cameraGuides[side].distance}</b><span>距底线 / 击球区</span></div><div><b>{cameraGuides[side].height}</b><span>镜头高度</span></div><div><b>{cameraGuides[side].lens}</b><span>推荐镜头</span></div></div>
      <p className="tip"><b>{side}机位怎么摆</b>{cameraGuides[side].note}</p>
      <button className="cta" onClick={()=>setScreen("recording")}>放好手机了，开始训练 <b>●</b></button>
      <button className="test-shot" onClick={()=>setScreen("check")}>不确定画面？先试拍 3 秒检查 <span>可跳过</span></button>
    </div>
  </Shell>;

  if (screen === "check") return <main className="recording preflight">
    <div className="rec-top"><button onClick={()=>setScreen("camera")}>←</button><span>3 秒试拍</span><b>{side}机位</b></div>
    <div className="viewfinder"><div className="frame-guide"><span>头部</span><i/><b>双脚需在框内</b></div><div className="check-card"><i>3</i><div><b>站到击球区，挥拍一次</b><span>试拍结束后自动确认人物是否完整入镜</span></div></div></div>
    <div className="check-actions"><p>这是可选步骤，不影响直接开始训练</p><button onClick={()=>setScreen("recording")}>开始 3 秒试拍</button><button className="skip-check" onClick={()=>setScreen("recording")}>跳过，直接开始训练</button></div>
  </main>;

  if (screen === "recording") return <main className="recording">
    <div className="rec-top"><button onClick={()=>setScreen("camera")}>×</button><span><i/> REC · 08:42</span><b>72 拍</b></div>
    <div className="viewfinder"><div className="body-guide"><i/><b/><span/><em/></div><div className="ball">●</div><div className="live-card"><span>本组关注</span><b>{focus}</b><p>再打 8 拍，保持击球后回位</p></div></div>
    <div className="rec-bottom"><button className="flip">↻</button><button className="stop" onClick={()=>setScreen("analysis")}><i/></button><button className="sound">♬</button></div>
  </main>;

  if (screen === "analysis") return <Shell title="训练复盘" onBack={()=>setScreen("home")}>
    <div className="session-head"><div><span>8月30日 · 发球机</span><h1>{focus}</h1></div><div className="score"><b>67</b><span>本次表现</span></div></div>
    <div className="stats"><div><b>12′38″</b><span>有效训练</span></div><div><b>86</b><span>有效击球</span></div><div><b>61%</b><span>甜点击球</span></div></div>
    <section className="priority-card" onClick={()=>setScreen("detail")}>
      <div className="priority-video"><div className="mini-person">●<i/></div><span>00:36</span><button>▶</button></div>
      <div className="priority-copy"><div className="pill">本次最优先改</div><h2>击球点偏晚</h2><p>不是挥拍慢，而是转体启动晚，导致球到了身体侧面才接触。</p><div className="cause"><span>看到球晚</span><i>→</i><span>转体晚</span><i>→</i><b>击球点晚</b></div><button>看证据和怎么改 <b>→</b></button></div>
    </section>
    <h2 className="section-title">这一场也做得不错</h2>
    <div className="wins"><div><i>✓</i><p><b>随挥完整</b><span>78% 的击球完成肩上收拍</span></p></div><div><i>✓</i><p><b>回位意识提升</b><span>比上次快了 0.3 秒</span></p></div></div>
    <nav><button onClick={()=>setScreen("home")}>⌂<span>训练</span></button><button className="active">▥<span>复盘</span></button><button>◒<span>进步</span></button><button>♙<span>我的</span></button></nav>
  </Shell>;

  if (screen === "detail") return <Shell title="问题拆解" onBack={back}>
    <div className="compare"><div><span>你的击球</span><div className="pose late">●<i/><b/></div><em>触球点</em></div><div><span>建议位置</span><div className="pose good">●<i/><b/></div><em>提前约 24cm</em></div></div>
    <div className="root-cause"><span>AI 判断 · 高置信度</span><h1>根因不是手臂，<br/>是准备启动晚了</h1><p>来球过网后，你平均晚约 0.28 秒开始转肩。手臂只能在身体旁边追球，拍面因此更容易打开。</p></div>
    <h2 className="section-title">下一组，只记一个口令</h2>
    <div className="mantra"><span>来球过网时</span><b>“肩膀先走，拍头在后”</b><i>↗</i></div>
    <div className="drill"><div className="drill-icon">3×8</div><div><b>影子挥拍 + 定点喂球</b><p>先做 8 次无球转体，再让发球机用慢速喂到正手。完成 3 组。</p></div></div>
    <button className={`cta ${saved?"done":""}`} onClick={()=>setSaved(true)}>{saved?"✓ 已加入下次训练":"加入下次训练计划"}</button>
  </Shell>;

  return <main className="home">
    <header><div className="logo">RALLY<span>·</span>ONE</div><button className="avatar">楠</button></header>
    <section className="welcome"><span>周日 · 适合练球</span><h1>一个人练，<br/>也有人<span>看得懂你。</span></h1><p>架好手机，放心去打。每一拍的问题、根因和改法，练完就知道。</p><button className="hero-cta" onClick={()=>setScreen("setup")}><span>＋</span><div><b>开始一次训练</b><small>约 30 秒完成架机</small></div><i>→</i></button></section>
    <section className="how"><div className="section-label">HOW IT WORKS</div>{steps.map((x,i)=><button className="how-step" key={x.n} onClick={()=>setScreen((["camera","recording","analysis"] as Screen[])[i])} aria-label={`进入${x.title}`}><b>{x.n}</b><div><h3>{x.title}</h3><p>{x.sub}</p></div><i>{["⌗","●","↗"][i]}</i></button>)}</section>
    <section className="last"><div><span>上次训练 · 8月27日</span><h2>正手击球点</h2><p><b>＋9</b> 稳定性提升</p></div><button onClick={()=>setScreen("analysis")}>查看复盘 →</button></section>
    <nav><button className="active">⌂<span>训练</span></button><button onClick={()=>setScreen("analysis")}>▥<span>复盘</span></button><button>◒<span>进步</span></button><button>♙<span>我的</span></button></nav>
  </main>;
}

function Shell({children,title,onBack,dark=false}:{children:React.ReactNode,title:string,onBack:()=>void,dark?:boolean}) {
  return <main className={`shell ${dark?"dark":""}`}><header className="appbar"><button onClick={onBack}>←</button><b>{title}</b><i>•••</i></header>{children}</main>;
}
