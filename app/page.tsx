"use client";

import { useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

type Screen =
  | "home"
  | "setup"
  | "camera"
  | "check"
  | "recording"
  | "analysis"
  | "detail"
  | "progress"
  | "profile";

const cameraGuides = {
  后方: {
    benefit: "落点、回位和左右移动",
    distance: "4–6m",
    height: "1.2–1.5m",
    lens: "0.5×",
    note: "手机与底线中点对齐，避免偏向正手或反手侧。",
  },
  侧方: {
    benefit: "击球点、引拍和重心转移",
    distance: "3–4m",
    height: "1.0–1.2m",
    lens: "0.5×",
    note: "镜头朝向主要击球区，与底线垂直，不要正对发球机。",
  },
  斜后方: {
    benefit: "挥拍动作和来球线路",
    distance: "4–5m",
    height: "1.2–1.4m",
    lens: "0.5×",
    note: "手机放在惯用手相反一侧，朝球场中心旋转约 45°，减少身体遮挡。",
  },
} as const;

const steps = [
  { n: "01", title: "架机", sub: "先让 AI 看得清" },
  { n: "02", title: "开练", sub: "自动切分每一拍" },
  { n: "03", title: "复盘", sub: "只改最关键的一件事" },
];

type Diagnosis = {
  title: string;
  summary: string;
  cue: string;
  drill: string;
  confidence: string;
  visibility: number;
  knee: number;
  stance: number;
  frames: number;
  swings?: number;
  evidence?: string;
};

type AnalysisTelemetry = {
  attempts: number;
  modelState: string;
  width: number;
  height: number;
};
function angle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
) {
  const ab = [a.x - b.x, a.y - b.y],
    cb = [c.x - b.x, c.y - b.y];
  const d = ab[0] * cb[0] + ab[1] * cb[1];
  const m = Math.hypot(...ab) * Math.hypot(...cb);
  return (Math.acos(Math.max(-1, Math.min(1, d / m))) * 180) / Math.PI;
}
function median(values: number[]) {
  const a = [...values].sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : 0;
}

const pointDistance = (a: NormalizedLandmark, b: NormalizedLandmark) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const midpoint = (a: NormalizedLandmark, b: NormalizedLandmark) =>
  ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: 0,
    visibility: Math.min(a.visibility ?? 0, b.visibility ?? 0),
  }) as NormalizedLandmark;

function createCompatibleRecorder(stream: MediaStream) {
  const supportedType = [
    "video/mp4;codecs=h264",
    "video/mp4",
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type));
  return supportedType
    ? new MediaRecorder(stream, { mimeType: supportedType })
    : new MediaRecorder(stream);
}

function diagnoseLegacy(samples: NormalizedLandmark[][]): Diagnosis {
  const good = samples.filter((p) => p.length === 33);
  const bodyPoints = [11, 12, 23, 24, 25, 26, 27, 28];
  const visibility = good.length
    ? good.reduce(
        (total, pose) =>
          total +
          bodyPoints.filter((i) => (pose[i]?.visibility ?? 0) > 0.3).length /
            bodyPoints.length,
        0,
      ) / good.length
    : 0;
  if (good.length < 8 || visibility < 0.5)
    return {
      title: "暂时无法可靠判断",
      summary:
        "有效人体关键点不足。请确认头部、双脚和挥拍手都在画面内，并避免逆光后再录一组。",
      cue: "先让全身完整入镜",
      drill: "调整机位后试拍 3 秒",
      confidence: "证据不足",
      visibility: Math.round(visibility * 100),
      knee: 0,
      stance: 0,
      frames: good.length,
    };
  const knees = good.flatMap((p) => [
    angle(p[23], p[25], p[27]),
    angle(p[24], p[26], p[28]),
  ]);
  const stances = good.map(
    (p) =>
      Math.abs(p[27].x - p[28].x) / Math.max(0.02, Math.abs(p[11].x - p[12].x)),
  );
  const knee = Math.round(median(knees)),
    stance = median(stances);
  if (knee > 158)
    return {
      title: "准备姿势屈膝不足",
      summary: `有效帧中膝关节角度中位数约 ${knee}°，身体较直，启动和回位时可用的弹性较少。`,
      cue: "髋部下沉，膝盖保持有弹性",
      drill: "3 组 × 8 次分腿垫步后启动",
      confidence: "中等置信度",
      visibility: Math.round(visibility * 100),
      knee,
      stance: Math.round(stance * 100) / 100,
      frames: good.length,
    };
  if (stance < 0.88)
    return {
      title: "准备站位偏窄",
      summary: `双脚间距约为肩宽的 ${stance.toFixed(1)} 倍，横向启动时支撑面偏小。`,
      cue: "双脚比肩略宽，前脚掌着地",
      drill: "3 组 × 20 秒底线横向小碎步",
      confidence: "中等置信度",
      visibility: Math.round(visibility * 100),
      knee,
      stance: Math.round(stance * 100) / 100,
      frames: good.length,
    };
  return {
    title: "准备与下肢支撑稳定",
    summary:
      "本组没有发现明显的站姿或屈膝问题。当前端侧模型无法可靠判断球拍面和真实触球点。",
    cue: "保持低重心，击球后回到底线中点",
    drill: "3 组 × 10 拍击球后触碰回位标记",
    confidence: "基础指标通过",
    visibility: Math.round(visibility * 100),
    knee,
    stance: Math.round(stance * 100) / 100,
    frames: good.length,
  };
}

function diagnose(
  samples: NormalizedLandmark[][],
  hand: "right" | "left",
  side: keyof typeof cameraGuides,
  telemetry?: AnalysisTelemetry,
): Diagnosis {
  const detected = samples.filter((pose) => pose.length === 33);
  const wrist = hand === "right" ? 16 : 15;
  const elbow = hand === "right" ? 14 : 13;
  const required = [0, 11, 12, 23, 24, 27, 28, wrist, elbow];
  const visibleEnough = (pose: NormalizedLandmark[], indexes: number[]) =>
    indexes.every((index) => (pose[index]?.visibility ?? 0) >= 0.15);
  // Ball and racket are deliberately not required. A frame is usable for the
  // body-framework diagnosis when the hitting arm and torso are trackable.
  const good = detected.filter((pose) =>
    visibleEnough(pose, [11, 12, 23, 24, wrist, elbow]),
  );
  const visibility = detected.length
    ? detected.reduce(
        (sum, pose) =>
          sum +
          required.filter((index) => (pose[index]?.visibility ?? 0) > 0.3)
            .length /
            required.length,
        0,
      ) / detected.length
    : 0;
  const legacy = diagnoseLegacy(samples);
  const common = {
    visibility: Math.round(visibility * 100),
    frames: good.length,
    knee: legacy.knee,
    stance: legacy.stance,
  };

  if (!detected.length)
    return {
      title: "动作识别没有实际运行成功",
      summary:
        telemetry?.modelState === "ready" && telemetry.attempts > 0
          ? `模型已经加载，并检查了 ${telemetry.attempts} 次画面，但没有检测到人体。请确认录像时绿色骨架确实出现；拍子是否入镜不影响人体检测。`
          : "录像成功，但动作模型没有在录像期间完成加载或运行。这不是你的站位问题，请重新进入训练并等待“动作识别已就绪”。",
      cue: "必须看到绿色骨架后再开始挥拍",
      drill: "返回重试；若仍无骨架，记录下方运行证据",
      confidence: "识别链路失败",
      ...common,
      swings: 0,
      evidence: `模型 ${telemetry?.modelState || "unknown"}；分析调用 ${telemetry?.attempts || 0} 次；画面 ${telemetry?.width || 0}×${telemetry?.height || 0}`,
    };

  if (good.length < 12)
    return {
      title: "暂时无法可靠判断",
      summary: `共识别到 ${detected.length} 帧人体，其中 ${good.length} 帧能同时看清挥拍手、手肘、肩和髋。球拍不必完整入镜；请等到画面显示“动作识别已就绪”后，再连续打 5–10 拍。`,
      cue: "看到绿色骨架后再开始连续挥拍",
      drill: "模型就绪后录制 15–20 秒正手定点球",
      confidence: "证据不足",
      ...common,
      swings: 0,
      evidence: `人体 ${detected.length} 帧；可分析挥拍 ${good.length} 帧；最低需要 12 帧`,
    };

  const speeds = good.map((pose, index) => {
    if (!index || (pose[wrist].visibility ?? 0) < 0.15) return 0;
    const width = Math.max(0.035, pointDistance(pose[11], pose[12]));
    return pointDistance(pose[wrist], good[index - 1][wrist]) / width;
  });
  const active = speeds.filter((speed) => speed > 0.08).sort((a, b) => a - b);
  const threshold = Math.max(
    0.18,
    active[Math.floor(active.length * 0.72)] || 0,
  );
  const peaks: number[] = [];
  speeds.forEach((speed, index) => {
    if (
      index >= 5 &&
      index < good.length - 5 &&
      speed >= threshold &&
      speed >= (speeds[index - 1] || 0) &&
      speed >= (speeds[index + 1] || 0) &&
      (!peaks.length || index - peaks[peaks.length - 1] >= 7)
    )
      peaks.push(index);
  });

  if (!peaks.length)
    return {
      title: "没有找到完整的正手挥拍",
      summary:
        "人物已经识别，但挥拍手没有形成清晰的加速—随挥阶段。请连续打 5–10 拍，并让挥拍手始终留在画面内。",
      cue: "连续挥拍，不要在动作中途走出画面",
      drill: "录制 10–20 秒正手定点球",
      confidence: "动作证据不足",
      ...common,
      swings: 0,
      evidence: `识别到 ${good.length} 帧人体，但未找到腕部速度峰值`,
    };

  const metrics = peaks.map((peak) => {
    const pre = good[peak - 4];
    const hit = good[peak];
    const post = good[peak + 4];
    const width = Math.max(0.035, pointDistance(hit[11], hit[12]));
    const preShoulder = midpoint(pre[11], pre[12]);
    const hitShoulder = midpoint(hit[11], hit[12]);
    const postShoulder = midpoint(post[11], post[12]);
    const preHip = midpoint(pre[23], pre[24]);
    const hitHip = midpoint(hit[23], hit[24]);
    const postHip = midpoint(post[23], post[24]);
    const wristMove =
      (pointDistance(pre[wrist], hit[wrist]) +
        pointDistance(hit[wrist], post[wrist])) /
      width;
    const torsoMove =
      (pointDistance(preShoulder, hitShoulder) +
        pointDistance(hitShoulder, postShoulder) +
        pointDistance(preHip, hitHip) +
        pointDistance(hitHip, postHip)) /
      width;
    const lean =
      Math.max(Math.abs(hit[0].x - hitHip.x), Math.abs(post[0].x - postHip.x)) /
      width;
    const footMin = Math.min(post[27].x, post[28].x) - width * 0.12;
    const footMax = Math.max(post[27].x, post[28].x) + width * 0.12;
    const balanced = postHip.x >= footMin && postHip.x <= footMax;
    const preRelative = pre[wrist].x - preShoulder.x;
    const postRelative = post[wrist].x - postShoulder.x;
    const crossed =
      preRelative * postRelative < 0 && Math.abs(postRelative) / width > 0.12;
    return {
      armOnly: wristMove > 0.9 && torsoMove < 0.38,
      unstable: !balanced || lean > 0.72,
      unfinished: !(crossed && post[wrist].y < postHip.y),
      lowTransfer: pointDistance(preHip, postHip) / width < 0.12,
    };
  });
  const count = (key: keyof (typeof metrics)[number]) =>
    metrics.filter((metric) => metric[key]).length;
  const majority = Math.ceil(peaks.length * 0.55);
  const result = { ...common, swings: peaks.length };

  if (count("unstable") >= majority)
    return {
      title: "挥拍中身体侧倾，重心没有稳住",
      summary: `${count("unstable")}/${peaks.length} 次挥拍在加速或随挥阶段出现头髋偏移过大、重心离开双脚支撑区。先稳住身体轴线，再追求挥拍速度。`,
      cue: "头留在两脚之间，转体但不要倒向一侧",
      drill: "3 组 × 8 次慢速挥拍，结束后定住 2 秒",
      confidence: "中等置信度",
      ...result,
      evidence: `${count("unstable")}/${peaks.length} 拍出现侧倾或支撑区外重心`,
    };
  if (count("armOnly") >= majority)
    return {
      title: "挥拍主要由手臂带动",
      summary: `${count("armOnly")}/${peaks.length} 次挥拍中，挥拍手移动明显，但肩和髋的协同位移较少。这通常会让动作费力、稳定性下降。`,
      cue: "肩髋先带动，手臂跟着身体向前",
      drill: "3 组 × 8 次夹毛巾转体影子挥拍",
      confidence: "中等置信度",
      ...result,
      evidence: `${count("armOnly")}/${peaks.length} 拍腕部加速明显、躯干参与偏少`,
    };
  if (count("unfinished") >= majority)
    return {
      title: "随挥与身体转动没有完成",
      summary: `${count("unfinished")}/${peaks.length} 次挥拍结束时，挥拍手没有清晰越过身体并停在较高位置。完整随挥有助于把力量送向目标。`,
      cue: "由后向前，结束时肩髋面向目标",
      drill: "3 组 × 8 次慢挥，拍手在对侧肩旁定住",
      confidence: "中等置信度",
      ...result,
      evidence: `${count("unfinished")}/${peaks.length} 拍未形成跨体、高位随挥`,
    };
  if (side !== "后方" && count("lowTransfer") >= majority)
    return {
      title: "向前的重心传递不明显",
      summary: `${count("lowTransfer")}/${peaks.length} 次挥拍的髋部从准备到随挥位移较少。侧方或斜后方机位更适合观察这一指标。`,
      cue: "后脚加载，击球后重心落到前脚",
      drill: "3 组 × 8 次跨步击球后定住",
      confidence: "方向性判断",
      ...result,
      evidence: `${count("lowTransfer")}/${peaks.length} 拍髋部前后位移偏少`,
    };

  return {
    ...legacy,
    ...result,
    title:
      legacy.title === "准备与下肢支撑稳定"
        ? "未发现反复出现的身体框架问题"
        : legacy.title,
    summary:
      legacy.title === "准备与下肢支撑稳定"
        ? `已比较 ${peaks.length} 次挥拍。当前尚未检测球拍，因此暂不判断“引拍大圈”、拍面和真实触球点。`
        : legacy.summary,
    evidence: `${peaks.length} 次挥拍已完成阶段比较；球拍轨迹暂未纳入`,
  };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [side, setSide] = useState<keyof typeof cameraGuides>("后方");
  const [focus, setFocus] = useState("正手稳定性");
  const [hand, setHand] = useState<"right" | "left">("right");
  const [saved, setSaved] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("准备录像…");
  const [reviewVideoUrl, setReviewVideoUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState<Diagnosis | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null),
    canvasRef = useRef<HTMLCanvasElement>(null),
    streamRef = useRef<MediaStream | null>(null),
    recorderRef = useRef<MediaRecorder | null>(null),
    samplesRef = useRef<NormalizedLandmark[][]>([]),
    landmarkerRef = useRef<PoseLandmarker | null>(null),
    modelPromiseRef = useRef<Promise<PoseLandmarker> | null>(null),
    modelStateRef = useRef("idle"),
    analysisAttemptsRef = useRef(0),
    videoSizeRef = useRef({ width: 0, height: 0 }),
    timerRef = useRef<number | undefined>(undefined),
    rafRef = useRef<number | undefined>(undefined);

  async function loadPoseModel() {
    if (landmarkerRef.current) return landmarkerRef.current;
    if (modelPromiseRef.current) return modelPromiseRef.current;
    modelStateRef.current = "loading";
    modelPromiseRef.current = (async () => {
      const base = new URL("./", window.location.href).href;
      const vision = await FilesetResolver.forVisionTasks(
        new URL("mediapipe-wasm", base).href,
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: new URL("pose_landmarker_lite.task", base).href,
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.2,
        minPosePresenceConfidence: 0.2,
        minTrackingConfidence: 0.2,
      });
      landmarkerRef.current = landmarker;
      modelStateRef.current = "ready";
      return landmarker;
    })();
    try {
      return await modelPromiseRef.current;
    } catch (error) {
      modelStateRef.current = "error";
      modelPromiseRef.current = null;
      throw error;
    }
  }

  useEffect(() => {
    // Start the 16MB model/WASM download before the user opens the camera.
    loadPoseModel().catch(() => undefined);
  }, []);

  async function startTraining(target: Screen = "recording") {
    setCameraError("");
    setRecordingStatus("准备录像…");
    if (reviewVideoUrl) URL.revokeObjectURL(reviewVideoUrl);
    setReviewVideoUrl("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setScreen(target);
    } catch {
      setCameraError("无法打开相机。请在浏览器设置中允许相机权限后重试。");
    }
  }
  async function saveVideo(blob: Blob) {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("rally-one", 1);
      req.onupgradeneeded = () =>
        req.result.createObjectStore("sessions", { keyPath: "id" });
      req.onsuccess = () => {
        const tx = req.result.transaction("sessions", "readwrite");
        tx.objectStore("sessions").put({
          id: Date.now(),
          createdAt: new Date().toISOString(),
          focus,
          side,
          blob,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }
  async function stopTraining() {
    if (recorderRef.current?.state === "recording") {
      try {
        recorderRef.current.requestData();
      } catch {}
      recorderRef.current.stop();
    }
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    window.setTimeout(
      () => streamRef.current?.getTracks().forEach((t) => t.stop()),
      150,
    );
    setAnalysisResult(
      diagnose(samplesRef.current, hand, side, {
        attempts: analysisAttemptsRef.current,
        modelState: modelStateRef.current,
        width: videoSizeRef.current.width,
        height: videoSizeRef.current.height,
      }),
    );
    setScreen("analysis");
  }

  useEffect(() => {
    if (
      (screen !== "recording" && screen !== "check") ||
      !streamRef.current ||
      !videoRef.current
    )
      return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video
      .play()
      .catch(() =>
        setCameraError("相机画面未能自动播放，请重新点击开始训练。"),
      );
    let cancelled = false;
    const chunks: Blob[] = [];
    samplesRef.current = [];
    analysisAttemptsRef.current = 0;
    videoSizeRef.current = { width: 0, height: 0 };
    setSeconds(0);
    try {
      const recorder = createCompatibleRecorder(streamRef.current);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onerror = () => {
        setRecordingStatus("录像失败");
        setCameraError("浏览器录像发生错误，请关闭其他相机应用后重试。");
      };
      recorder.onstop = () => {
        if (!chunks.length) {
          setCameraError("本次没有生成视频，请重新录制并保持至少 5 秒。");
          return;
        }
        const blob = new Blob(chunks, {
          type: recorder.mimeType || chunks[0].type || "video/mp4",
        });
        setReviewVideoUrl(URL.createObjectURL(blob));
        saveVideo(blob).catch(() =>
          setCameraError("视频可以复盘，但本机长期保存失败。"),
        );
      };
      recorder.start(1000);
      setRecordingStatus("录像中");
    } catch {
      recorderRef.current = null;
      setRecordingStatus("录像失败");
      setCameraError(
        "当前浏览器不支持网页录像，请使用最新版 Safari 或 Chrome。",
      );
    }
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    (async () => {
      try {
        setRecordingStatus((status) =>
          status === "录像中" ? "录像中 · 正在加载动作识别" : status,
        );
        const landmarker = await loadPoseModel();
        setRecordingStatus((status) =>
          status.startsWith("录像中") ? "录像中 · 动作识别已就绪" : status,
        );
        let last = 0;
        const loop = () => {
          if (cancelled) return;
          if (video.readyState >= 2 && performance.now() - last > 100) {
            last = performance.now();
            analysisAttemptsRef.current += 1;
            videoSizeRef.current = {
              width: video.videoWidth,
              height: video.videoHeight,
            };
            const result = landmarker.detectForVideo(video, last);
            if (result.landmarks[0]) {
              samplesRef.current.push(result.landmarks[0]);
              const canvas = canvasRef.current;
              if (canvas) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  new DrawingUtils(ctx).drawConnectors(
                    result.landmarks[0],
                    PoseLandmarker.POSE_CONNECTIONS,
                    { color: "#c9f234", lineWidth: 3 },
                  );
                }
              }
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setCameraError("动作识别模型加载失败，但仍可继续录制视频。");
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [screen]);

  const back = () =>
    setScreen(
      screen === "camera" ? "setup" : screen === "setup" ? "home" : "analysis",
    );

  if (screen === "setup")
    return (
      <Shell title="开始训练" onBack={() => setScreen("home")}>
        <div className="step-line">
          <i />
          <b>训练设置</b>
          <span>约 30 秒</span>
        </div>
        <h1 className="screen-title">今天想练什么？</h1>
        <p className="muted">选一个重点。练完后，我们会围绕它给出反馈。</p>
        <div className="focus-grid">
          {[
            "正手稳定性",
            "反手稳定性",
            "击球点",
            "步伐与还原",
            "发球",
            "随便练练",
          ].map((x, i) => (
            <button
              key={x}
              onClick={() => setFocus(x)}
              className={focus === x ? "active" : ""}
            >
              <span>{["↗", "↖", "◎", "⌁", "↑", "✦"][i]}</span>
              {x}
            </button>
          ))}
        </div>
        <label className="field-label">你的惯用手</label>
        <div className="segmented">
          <button
            className={hand === "right" ? "active" : ""}
            onClick={() => setHand("right")}
          >
            右手
          </button>
          <button
            className={hand === "left" ? "active" : ""}
            onClick={() => setHand("left")}
          >
            左手
          </button>
        </div>
        <label className="field-label">球源</label>
        <div className="segmented">
          <button className="active">发球机</button>
          <button>墙练</button>
          <button>自抛球</button>
        </div>
        <button className="cta" onClick={() => setScreen("camera")}>
          下一步 · 架好手机 <b>→</b>
        </button>
      </Shell>
    );

  if (screen === "camera")
    return (
      <Shell title="架机助手" onBack={back} dark>
        <div className="camera-stage">
          <div className="court-wrap">
            <span className="court-caption">标准网球场 · 俯视图</span>
            <div className="court">
              <div className="singles singles-left" />
              <div className="singles singles-right" />
              <div className="service service-far" />
              <div className="service service-near" />
              <div className="center-service" />
              <div className="net" />
              <div className="player">
                <span className="head" />
                <span className="body" />
                <span className="arms" />
                <span className="legs" />
                <em>击球者</em>
              </div>
            </div>
            <div className={`phone ${side}`}>
              <b>▯</b>
              <span>手机</span>
            </div>
          </div>
          <div className="camera-ok pending">
            <i>1</i>
            <div>
              <b>按图放到推荐位置</b>
              <span>确认手机稳定、镜头无遮挡即可开始</span>
            </div>
          </div>
        </div>
        <div className="sheet">
          <div className="sheet-handle" />
          <div className="angle-tabs">
            {["后方", "侧方", "斜后方"].map((x) => (
              <button
                key={x}
                onClick={() => setSide(x)}
                className={side === x ? "active" : ""}
              >
                {x}
              </button>
            ))}
          </div>
          <span className="purpose-label">这个机位适合看</span>
          <h2>{cameraGuides[side].benefit}</h2>
          <div className="measurements">
            <div>
              <b>{cameraGuides[side].distance}</b>
              <span>距底线 / 击球区</span>
            </div>
            <div>
              <b>{cameraGuides[side].height}</b>
              <span>镜头高度</span>
            </div>
            <div>
              <b>{cameraGuides[side].lens}</b>
              <span>推荐镜头</span>
            </div>
          </div>
          <p className="tip">
            <b>{side}机位怎么摆</b>
            {cameraGuides[side].note}
          </p>
          {cameraError && <p className="camera-error">{cameraError}</p>}
          <button className="cta" onClick={() => startTraining("recording")}>
            放好手机了，开始训练 <b>●</b>
          </button>
          <button className="test-shot" onClick={() => startTraining("check")}>
            不确定画面？先试拍 3 秒检查 <span>可跳过</span>
          </button>
        </div>
      </Shell>
    );

  if (screen === "check")
    return (
      <main className="recording preflight">
        <div className="rec-top">
          <button onClick={() => setScreen("camera")}>←</button>
          <span>3 秒试拍</span>
          <b>{side}机位</b>
        </div>
        <div className="viewfinder">
          <video ref={videoRef} muted playsInline />
          <canvas ref={canvasRef} />
          <div className="frame-guide">
            <span>头部</span>
            <i />
            <b>双脚需在框内</b>
          </div>
          <div className="check-card">
            <i>{Math.max(0, 3 - seconds)}</i>
            <div>
              <b>站到击球区，挥拍一次</b>
              <span>绿色骨架出现，代表已识别到人物</span>
            </div>
          </div>
        </div>
        <div className="check-actions">
          <p>这是可选步骤，不影响直接开始训练</p>
          <button
            onClick={() => {
              stopTraining();
              setScreen("camera");
            }}
          >
            完成试拍，返回调整
          </button>
          <button
            className="skip-check"
            onClick={() => {
              streamRef.current?.getTracks().forEach((t) => t.stop());
              setScreen("camera");
            }}
          >
            跳过试拍
          </button>
        </div>
      </main>
    );

  if (screen === "recording")
    return (
      <main className="recording">
        <div className="rec-top">
          <button onClick={stopTraining}>×</button>
          <span>
            <i /> {recordingStatus} ·{" "}
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </span>
          <b>{samplesRef.current.length} 帧</b>
        </div>
        <div className="viewfinder">
          <video ref={videoRef} muted playsInline />
          <canvas ref={canvasRef} />
          <div className="live-card">
            <span>{recordingStatus} · 视频仅保存在本机</span>
            <b>{focus}</b>
            <p>
              {cameraError ||
                (recordingStatus.includes("已就绪")
                  ? "现在开始挥拍 · 身体和挥拍手入镜即可，球拍可以出框"
                  : "请等动作识别就绪；绿色骨架出现后再开始挥拍")}
            </p>
          </div>
        </div>
        <div className="rec-bottom">
          <button className="flip">锁定</button>
          <button className="stop" onClick={stopTraining}>
            <i />
          </button>
          <button className="sound">静音</button>
        </div>
      </main>
    );

  if (screen === "analysis")
    return (
      <Shell title="训练复盘" onBack={() => setScreen("home")}>
        <div className="session-head">
          <div>
            <span>{new Date().toLocaleDateString("zh-CN")} · 本机分析</span>
            <h1>{focus}</h1>
          </div>
          <div className="score">
            <b>{analysisResult?.visibility ?? 0}</b>
            <span>入镜完整度</span>
          </div>
        </div>
        <div className="stats">
          <div>
            <b>{seconds}s</b>
            <span>有效训练</span>
          </div>
          <div>
            <b>{analysisResult?.frames ?? 0}</b>
            <span>有效姿态帧</span>
          </div>
          <div>
            <b>{analysisResult?.swings || "—"}</b>
            <span>识别挥拍</span>
          </div>
        </div>
        <section className="priority-card" onClick={() => setScreen("detail")}>
          <div className="priority-video">
            {reviewVideoUrl ? (
              <video
                src={reviewVideoUrl}
                controls
                playsInline
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <div className="mini-person">
                ●<i />
              </div>
            )}
            <span>{seconds}s</span>
          </div>
          <div className="priority-copy">
            <div className="pill">
              {analysisResult?.confidence || "示例报告"}
            </div>
            <h2>{analysisResult?.title || "还没有真实训练数据"}</h2>
            <p>{analysisResult?.summary || "请先完成一次真实录制。"}</p>
            <div className="cause">
              <span>完整入镜 {analysisResult?.visibility ?? 0}%</span>
              <i>·</i>
              <span>{analysisResult?.swings || 0} 次挥拍</span>
              <i>·</i>
              <b>{analysisResult?.frames ?? 0} 帧证据</b>
            </div>
            {analysisResult?.evidence && (
              <p className="evidence-line">证据：{analysisResult.evidence}</p>
            )}
            <button>
              查看训练口令 <b>→</b>
            </button>
          </div>
        </section>
        <h2 className="section-title">这一场也做得不错</h2>
        <div className="wins">
          <div>
            <i>✓</i>
            <p>
              <b>下一组口令</b>
              <span>{analysisResult?.cue || "完成真实录制后生成"}</span>
            </p>
          </div>
          <div>
            <i>↗</i>
            <p>
              <b>建议练习</b>
              <span>{analysisResult?.drill || "完成真实录制后生成"}</span>
            </p>
          </div>
        </div>
        <BottomNav screen={screen} setScreen={setScreen} />
      </Shell>
    );

  if (screen === "detail")
    return (
      <Shell title="问题拆解" onBack={back}>
        <div className="compare">
          <div>
            <span>你的击球</span>
            <div className="pose late">
              ●<i />
              <b />
            </div>
            <em>触球点</em>
          </div>
          <div>
            <span>建议位置</span>
            <div className="pose good">
              ●<i />
              <b />
            </div>
            <em>提前约 24cm</em>
          </div>
        </div>
        <div className="root-cause">
          <span>AI 判断 · 高置信度</span>
          <h1>
            根因不是手臂，
            <br />
            是准备启动晚了
          </h1>
          <p>
            来球过网后，你平均晚约 0.28
            秒开始转肩。手臂只能在身体旁边追球，拍面因此更容易打开。
          </p>
        </div>
        <h2 className="section-title">下一组，只记一个口令</h2>
        <div className="mantra">
          <span>来球过网时</span>
          <b>“肩膀先走，拍头在后”</b>
          <i>↗</i>
        </div>
        <div className="drill">
          <div className="drill-icon">3×8</div>
          <div>
            <b>影子挥拍 + 定点喂球</b>
            <p>先做 8 次无球转体，再让发球机用慢速喂到正手。完成 3 组。</p>
          </div>
        </div>
        <button
          className={`cta ${saved ? "done" : ""}`}
          onClick={() => setSaved(true)}
        >
          {saved ? "✓ 已加入下次训练" : "加入下次训练计划"}
        </button>
      </Shell>
    );

  if (screen === "progress")
    return (
      <Shell title="我的进步" onBack={() => setScreen("home")}>
        <section className="progress-hero">
          <span>过去 30 天</span>
          <div>
            <h1>
              稳定性 <b>+14</b>
            </h1>
            <em>保持得不错</em>
          </div>
          <p>你完成了 6 次独练，最明显的变化是正手击球点更靠前。</p>
        </section>
        <section className="trend-card">
          <div className="card-head">
            <div>
              <span>正手稳定性</span>
              <h2>
                67 <small>/ 100</small>
              </h2>
            </div>
            <b>↗ 9%</b>
          </div>
          <div className="trend-chart">
            <i style={{ height: "32%" }} />
            <i style={{ height: "41%" }} />
            <i style={{ height: "39%" }} />
            <i style={{ height: "56%" }} />
            <i style={{ height: "63%" }} />
            <i style={{ height: "72%" }} />
            <span className="chart-line" />
          </div>
          <div className="chart-labels">
            <span>8月1日</span>
            <span>今天</span>
          </div>
        </section>
        <h2 className="section-title">能力分布</h2>
        <section className="skill-list">
          {[
            ["击球点", "72", "#c9f234"],
            ["挥拍完整度", "78", "#89c8a1"],
            ["回位速度", "64", "#f4c46b"],
            ["连续稳定性", "58", "#ee907f"],
          ].map((x) => (
            <div key={x[0]}>
              <p>
                <span>{x[0]}</span>
                <b>{x[1]}</b>
              </p>
              <i>
                <em style={{ width: `${x[1]}%`, background: x[2] }} />
              </i>
            </div>
          ))}
        </section>
        <section className="milestone">
          <i>✓</i>
          <div>
            <span>最近达成</span>
            <b>连续 20 拍不失误</b>
            <p>8月27日 · 正手定点训练</p>
          </div>
        </section>
        <BottomNav screen={screen} setScreen={setScreen} />
      </Shell>
    );

  if (screen === "profile")
    return (
      <Shell title="我的" onBack={() => setScreen("home")}>
        <section className="profile-head">
          <div className="profile-avatar">楠</div>
          <div>
            <h1>网球练习生</h1>
            <p>NTRP 2.5 · 右手持拍</p>
          </div>
          <button>编辑</button>
        </section>
        <section className="profile-stats">
          <div>
            <b>8</b>
            <span>训练次数</span>
          </div>
          <div>
            <b>3.4h</b>
            <span>有效训练</span>
          </div>
          <div>
            <b>486</b>
            <span>分析击球</span>
          </div>
        </section>
        <div className="settings-label">训练设置</div>
        <section className="settings">
          {[
            ["◎", "我的水平", "NTRP 2.5"],
            ["↗", "惯用手", "右手"],
            ["⌗", "默认机位", "后方"],
            ["◉", "视频画质", "1080P · 60fps"],
          ].map((x) => (
            <button key={x[1]}>
              <i>{x[0]}</i>
              <span>{x[1]}</span>
              <b>{x[2]}</b>
              <em>›</em>
            </button>
          ))}
        </section>
        <div className="settings-label">数据与支持</div>
        <section className="settings">
          <button>
            <i>▣</i>
            <span>训练视频管理</span>
            <b>仅保存在本机</b>
            <em>›</em>
          </button>
          <button>
            <i>?</i>
            <span>架机帮助</span>
            <em>›</em>
          </button>
        </section>
        <BottomNav screen={screen} setScreen={setScreen} />
      </Shell>
    );

  return (
    <main className="home">
      <header>
        <div className="logo">
          RALLY<span>·</span>ONE
        </div>
        <button className="avatar">楠</button>
      </header>
      <section className="welcome">
        <span>周日 · 适合练球</span>
        <h1>
          一个人练，
          <br />
          也有人<span>看得懂你。</span>
        </h1>
        <p>架好手机，放心去打。每一拍的问题、根因和改法，练完就知道。</p>
        <button className="hero-cta" onClick={() => setScreen("setup")}>
          <span>＋</span>
          <div>
            <b>开始一次训练</b>
            <small>约 30 秒完成架机</small>
          </div>
          <i>→</i>
        </button>
      </section>
      <section className="how">
        <div className="section-label">HOW IT WORKS</div>
        {steps.map((x, i) => (
          <button
            className="how-step"
            key={x.n}
            onClick={() =>
              setScreen((["camera", "recording", "analysis"] as Screen[])[i])
            }
            aria-label={`进入${x.title}`}
          >
            <b>{x.n}</b>
            <div>
              <h3>{x.title}</h3>
              <p>{x.sub}</p>
            </div>
            <i>{["⌗", "●", "↗"][i]}</i>
          </button>
        ))}
      </section>
      <section className="last">
        <div>
          <span>上次训练 · 8月27日</span>
          <h2>正手击球点</h2>
          <p>
            <b>＋9</b> 稳定性提升
          </p>
        </div>
        <button onClick={() => setScreen("analysis")}>查看复盘 →</button>
      </section>
      <BottomNav screen={screen} setScreen={setScreen} />
    </main>
  );
}

function BottomNav({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}) {
  const items: [Screen, string, string][] = [
    ["home", "⌂", "训练"],
    ["analysis", "▥", "复盘"],
    ["progress", "◒", "进步"],
    ["profile", "♙", "我的"],
  ];
  return (
    <nav>
      {items.map(([target, icon, label]) => (
        <button
          key={target}
          className={screen === target ? "active" : ""}
          onClick={() => setScreen(target)}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Shell({
  children,
  title,
  onBack,
  dark = false,
}: {
  children: React.ReactNode;
  title: string;
  onBack: () => void;
  dark?: boolean;
}) {
  return (
    <main className={`shell ${dark ? "dark" : ""}`}>
      <header className="appbar">
        <button onClick={onBack}>←</button>
        <b>{title}</b>
        <i>•••</i>
      </header>
      {children}
    </main>
  );
}
