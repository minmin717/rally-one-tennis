"use client";

import { useState } from "react";

type Screen = "home" | "setup" | "camera" | "recording" | "analysis" | "detail";

const steps = [
  { n: "01", title: "架机", sub: "先让 AI 看得清" },
  { n: "02", title: "开练", sub: "自动切分每一拍" },
  { n: "03", title: "复盘", sub: "只改最关键的一件事" },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [side, setSide] = useState("后方");
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
      <div className="court"><div className="baseline"/><div className="service"/><div className="net"/><div className="player">●<i/></div><div className={`phone ${side}`}>▮<span>手机</span></div></div>
      <div className="camera-ok"><i>✓</i><div><b>全身已入镜</b><span>机位适合分析 {focus}</span></div></div>
    </div>
    <div className="sheet">
      <div className="sheet-handle"/>
      <div className="angle-tabs">{["后方","侧方","斜后方"].map(x=><button key={x} onClick={()=>setSide(x)} className={side===x?"active":""}>{x}</button>)}</div>
      <h2>{side === "后方" ? "推荐：底线后方 45°" : side === "侧方" ? "适合看击球点与重心" : "适合同时看挥拍与落点"}</h2>
      <div className="measurements"><div><b>4–6m</b><span>距底线</span></div><div><b>1.2m</b><span>镜头高度</span></div><div><b>0.5×</b><span>广角镜头</span></div></div>
      <p className="tip"><b>别把手机放在地上</b>低机位会让腿部遮挡击球点，也更难判断重心移动。</p>
      <button className="cta" onClick={()=>setScreen("recording")}>机位好了，开始训练 <b>●</b></button>
    </div>
  </Shell>;

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
