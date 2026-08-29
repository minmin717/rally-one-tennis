"use client";

import { useState } from "react";

type Screen = "home" | "setup" | "camera" | "check" | "recording" | "analysis" | "detail" | "progress" | "profile";

const cameraGuides = {
  "后方": { benefit: "落点、回位和左右移动", distance: "4–6m", height: "1.2–1.5m", lens: "0.5×", note: "手机与底线中点对齐，避免偏向正手或反手侧。" },
  "侧方": { benefit: "击球点、引拍和重心转移", distance: "3–4m", height: "1.0–1.2m", lens: "0.5×", note: "镜头朝向主要击球区，与底线垂直，不要正对发球机。" },
  "斜后方": { benefit: "挥拍动作和来球线路", distance: "4–5m", height: "1.2–1.4m", lens: "0.5×", note: "手机放在惯用手相反一侧，朝球场中心旋转约 45°，减少身体遮挡。" },
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
      <span className="purpose-label">这个机位适合看</span><h2>{cameraGuides[side].benefit}</h2>
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
    <BottomNav screen={screen} setScreen={setScreen}/>
  </Shell>;

  if (screen === "detail") return <Shell title="问题拆解" onBack={back}>
    <div className="compare"><div><span>你的击球</span><div className="pose late">●<i/><b/></div><em>触球点</em></div><div><span>建议位置</span><div className="pose good">●<i/><b/></div><em>提前约 24cm</em></div></div>
    <div className="root-cause"><span>AI 判断 · 高置信度</span><h1>根因不是手臂，<br/>是准备启动晚了</h1><p>来球过网后，你平均晚约 0.28 秒开始转肩。手臂只能在身体旁边追球，拍面因此更容易打开。</p></div>
    <h2 className="section-title">下一组，只记一个口令</h2>
    <div className="mantra"><span>来球过网时</span><b>“肩膀先走，拍头在后”</b><i>↗</i></div>
    <div className="drill"><div className="drill-icon">3×8</div><div><b>影子挥拍 + 定点喂球</b><p>先做 8 次无球转体，再让发球机用慢速喂到正手。完成 3 组。</p></div></div>
    <button className={`cta ${saved?"done":""}`} onClick={()=>setSaved(true)}>{saved?"✓ 已加入下次训练":"加入下次训练计划"}</button>
  </Shell>;

  if (screen === "progress") return <Shell title="我的进步" onBack={()=>setScreen("home")}>
    <section className="progress-hero"><span>过去 30 天</span><div><h1>稳定性 <b>+14</b></h1><em>保持得不错</em></div><p>你完成了 6 次独练，最明显的变化是正手击球点更靠前。</p></section>
    <section className="trend-card"><div className="card-head"><div><span>正手稳定性</span><h2>67 <small>/ 100</small></h2></div><b>↗ 9%</b></div><div className="trend-chart"><i style={{height:"32%"}}/><i style={{height:"41%"}}/><i style={{height:"39%"}}/><i style={{height:"56%"}}/><i style={{height:"63%"}}/><i style={{height:"72%"}}/><span className="chart-line"/></div><div className="chart-labels"><span>8月1日</span><span>今天</span></div></section>
    <h2 className="section-title">能力分布</h2>
    <section className="skill-list">{[["击球点","72","#c9f234"],["挥拍完整度","78","#89c8a1"],["回位速度","64","#f4c46b"],["连续稳定性","58","#ee907f"]].map(x=><div key={x[0]}><p><span>{x[0]}</span><b>{x[1]}</b></p><i><em style={{width:`${x[1]}%`,background:x[2]}}/></i></div>)}</section>
    <section className="milestone"><i>✓</i><div><span>最近达成</span><b>连续 20 拍不失误</b><p>8月27日 · 正手定点训练</p></div></section>
    <BottomNav screen={screen} setScreen={setScreen}/>
  </Shell>;

  if (screen === "profile") return <Shell title="我的" onBack={()=>setScreen("home")}>
    <section className="profile-head"><div className="profile-avatar">楠</div><div><h1>网球练习生</h1><p>NTRP 2.5 · 右手持拍</p></div><button>编辑</button></section>
    <section className="profile-stats"><div><b>8</b><span>训练次数</span></div><div><b>3.4h</b><span>有效训练</span></div><div><b>486</b><span>分析击球</span></div></section>
    <div className="settings-label">训练设置</div>
    <section className="settings">{[["◎","我的水平","NTRP 2.5"],["↗","惯用手","右手"],["⌗","默认机位","后方"],["◉","视频画质","1080P · 60fps"]].map(x=><button key={x[1]}><i>{x[0]}</i><span>{x[1]}</span><b>{x[2]}</b><em>›</em></button>)}</section>
    <div className="settings-label">数据与支持</div>
    <section className="settings"><button><i>▣</i><span>训练视频管理</span><b>仅保存在本机</b><em>›</em></button><button><i>?</i><span>架机帮助</span><em>›</em></button></section>
    <BottomNav screen={screen} setScreen={setScreen}/>
  </Shell>;

  return <main className="home">
    <header><div className="logo">RALLY<span>·</span>ONE</div><button className="avatar">楠</button></header>
    <section className="welcome"><span>周日 · 适合练球</span><h1>一个人练，<br/>也有人<span>看得懂你。</span></h1><p>架好手机，放心去打。每一拍的问题、根因和改法，练完就知道。</p><button className="hero-cta" onClick={()=>setScreen("setup")}><span>＋</span><div><b>开始一次训练</b><small>约 30 秒完成架机</small></div><i>→</i></button></section>
    <section className="how"><div className="section-label">HOW IT WORKS</div>{steps.map((x,i)=><button className="how-step" key={x.n} onClick={()=>setScreen((["camera","recording","analysis"] as Screen[])[i])} aria-label={`进入${x.title}`}><b>{x.n}</b><div><h3>{x.title}</h3><p>{x.sub}</p></div><i>{["⌗","●","↗"][i]}</i></button>)}</section>
    <section className="last"><div><span>上次训练 · 8月27日</span><h2>正手击球点</h2><p><b>＋9</b> 稳定性提升</p></div><button onClick={()=>setScreen("analysis")}>查看复盘 →</button></section>
    <BottomNav screen={screen} setScreen={setScreen}/>
  </main>;
}

function BottomNav({screen,setScreen}:{screen:Screen,setScreen:(screen:Screen)=>void}) {
  const items:[Screen,string,string][] = [["home","⌂","训练"],["analysis","▥","复盘"],["progress","◒","进步"],["profile","♙","我的"]];
  return <nav>{items.map(([target,icon,label])=><button key={target} className={screen===target?"active":""} onClick={()=>setScreen(target)}>{icon}<span>{label}</span></button>)}</nav>;
}

function Shell({children,title,onBack,dark=false}:{children:React.ReactNode,title:string,onBack:()=>void,dark?:boolean}) {
  return <main className={`shell ${dark?"dark":""}`}><header className="appbar"><button onClick={onBack}>←</button><b>{title}</b><i>•••</i></header>{children}</main>;
}
