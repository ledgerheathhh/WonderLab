import type { Course, Project, Scene } from "./types";
import type { Language } from "./i18n";
const copy = {
  zh: [
    {
      title: "看见复利的力量",
      subject: "经济学",
      summary:
        "把时间变成你的合伙人。从一个小实验开始，理解复利、风险与长期决策。",
      source:
        "复利是指每一期的收益加入本金，并在下一期继续产生收益。在本金和收益率不变的情况下，投资时间越长，复利的累积效应越明显。投资收益并不保证，潜在收益通常伴随风险。合理的投资流程是先明确目标，再评估风险承受能力，然后制定分散配置方案，最后定期复盘。",
      variable: "持有年数",
      unit: "年",
      result: "账户价值",
      resultUnit: "元",
      goal: "把持有时间调整到 15–20 年，观察 10,000 元以年收益率 5% 累积的变化。",
      explanation:
        "复利让收益继续产生收益。这里假设每年收益率固定为 5%，不计费用、税费和通胀；真实投资回报会波动。图表以各年数据进行线性插值。",
      hint: "把滑块向右移动，比较前五年和后五年的增加幅度。",
      context:
        "你准备为十年后的学习计划存一笔钱。面对“高收益、零风险”的承诺，你会怎么做？",
      options: [
        "立即投入全部储蓄",
        "先核实风险，再考虑分散配置",
        "只根据过去一年的收益做决定",
      ],
      feedback: [
        "收益并不保证，集中投入还会放大风险。",
        "合理。先认识风险，再做匹配目标的配置。",
        "过去的收益不能保证未来结果。",
      ],
      sortTitle: "搭建你的决策流程",
      sortGoal: "把理性投资的四个步骤按先后顺序排列。",
      steps: [
        "明确学习资金目标",
        "评估风险承受能力",
        "制定分散配置方案",
        "定期复盘与调整",
      ],
    },
    {
      title: "弹簧里的物理规律",
      subject: "自然科学",
      summary: "动手拉伸一根理想弹簧，探索力、形变与实验推理。",
      source:
        "胡克定律指出，在弹性限度内，弹簧弹力的大小与伸长量成正比，即 F = kx。k 是劲度系数，单位为牛顿每米。超出弹性限度后，这一线性关系不再成立。进行实验时，应先明确问题，再控制变量并测量，最后分析数据并得出结论。",
      variable: "伸长量",
      unit: "m",
      result: "弹力",
      resultUnit: "N",
      goal: "将伸长量调整到 0.3–0.4 m，观察劲度系数为 100 N/m 的理想弹簧。",
      explanation:
        "在弹性限度内，F = kx。伸长量加倍，弹力也加倍。这里使用理想线性模型，不能外推到超过弹性限度的情况。",
      hint: "当伸长量是 0.3 m 时，用 100 × 0.3 计算弹力。",
      context:
        "你发现弹簧被过度拉伸后不再恢复原状。此时还能直接用胡克定律预测弹力吗？",
      options: [
        "可以，所有形变都满足线性关系",
        "不能，应检查是否超出弹性限度",
        "只需把劲度系数随意加倍",
      ],
      feedback: [
        "胡克定律有适用条件。",
        "正确。超出弹性限度，模型可能失效。",
        "模型失效不能通过任意修改参数解决。",
      ],
      sortTitle: "组织一次科学实验",
      sortGoal: "将实验研究步骤排成合理顺序。",
      steps: [
        "明确研究问题",
        "控制变量并测量",
        "分析实验数据",
        "得出结论并说明限制",
      ],
    },
    {
      title: "像程序员一样思考",
      subject: "编程",
      summary: "从一个登录流程出发，练习条件判断、执行顺序和调试。",
      source:
        "条件判断让程序根据条件选择不同的执行分支。处理用户登录时，先接收输入，再校验格式，然后验证凭证，最后返回成功或失败的结果。不要在日志中记录密码明文。调试时，应先稳定复现问题，再定位原因，修改代码，最后重新验证。",
      variable: "",
      unit: "",
      result: "",
      resultUnit: "",
      goal: "",
      explanation: "",
      hint: "",
      context:
        "你在排查登录失败的问题。同事建议把用户的明文密码写入日志。你会怎么做？",
      options: [
        "记录所有密码，方便排查",
        "拒绝记录密码，使用脱敏信息定位问题",
        "跳过凭证验证以修复登录",
      ],
      feedback: [
        "明文日志会暴露敏感凭证。",
        "正确。可以记录失败阶段和脱敏错误信息。",
        "绕过验证会破坏登录机制。",
      ],
      sortTitle: "设计登录流程",
      sortGoal: "将登录处理步骤排列成正确的执行顺序。",
      steps: [
        "接收用户输入",
        "校验输入格式",
        "验证登录凭证",
        "返回成功或失败结果",
      ],
    },
  ],
  en: [
    {
      title: "The quiet power of compounding",
      subject: "Economics",
      summary:
        "Make time your learning partner. Explore compounding, risk, and long-term decisions.",
      source:
        "Compounding adds each period’s returns to the principal so they can earn returns in the next period. With a fixed principal and return rate, more time increases the cumulative effect. Investment returns are not guaranteed, and potential returns involve risk. A sound process starts with goals, evaluates risk tolerance, creates a diversified allocation, and reviews regularly.",
      variable: "Years invested",
      unit: "years",
      result: "Account value",
      resultUnit: "USD",
      goal: "Set the holding period to 15–20 years and observe 10,000 growing at a fixed 5% annual return.",
      explanation:
        "Compounding lets returns earn returns. This model assumes a fixed 5% annual rate and excludes fees, taxes, and inflation. Real returns fluctuate. The chart linearly interpolates annual data.",
      hint: "Move the slider right. Compare the increase in the first five years with the last five.",
      context:
        "You are saving for a study program ten years from now. Someone promises high returns with zero risk. What do you do?",
      options: [
        "Invest all savings immediately",
        "Verify risks and consider diversification",
        "Decide only on last year’s returns",
      ],
      feedback: [
        "Returns are not guaranteed; concentration adds risk.",
        "Good. Understand risk and match the allocation to your goals.",
        "Past returns do not guarantee future results.",
      ],
      sortTitle: "Build a decision process",
      sortGoal: "Put the four investing steps in their logical order.",
      steps: [
        "Define the funding goal",
        "Assess risk tolerance",
        "Create a diversified allocation",
        "Review and adjust regularly",
      ],
    },
    {
      title: "The physics inside a spring",
      subject: "Natural science",
      summary:
        "Stretch an ideal spring to explore force, deformation, and scientific reasoning.",
      source:
        "Hooke’s law states that within the elastic limit, spring force is proportional to extension: F = kx. The spring constant k is measured in newtons per meter. Beyond the elastic limit, this linear relationship no longer holds. An experiment starts with a question, controls variables and measures, then analyzes data and reaches a conclusion.",
      variable: "Extension",
      unit: "m",
      result: "Force",
      resultUnit: "N",
      goal: "Set the extension to 0.3–0.4 m for an ideal spring with a spring constant of 100 N/m.",
      explanation:
        "Within the elastic limit, F = kx. Doubling extension doubles force. This ideal linear model cannot be extrapolated beyond the elastic limit.",
      hint: "At 0.3 m, calculate force as 100 × 0.3.",
      context:
        "An overstretched spring no longer returns to its original shape. Can you still directly use Hooke’s law?",
      options: [
        "Yes, every deformation is linear",
        "No, check whether the elastic limit was exceeded",
        "Just arbitrarily double the spring constant",
      ],
      feedback: [
        "Hooke’s law has limits.",
        "Correct. Beyond the elastic limit, the model can fail.",
        "Arbitrary parameter changes do not fix a failed model.",
      ],
      sortTitle: "Organize an experiment",
      sortGoal: "Put the experimental steps into a logical order.",
      steps: [
        "Define the research question",
        "Control variables and measure",
        "Analyze the data",
        "Conclude and state limitations",
      ],
    },
    {
      title: "Think like a programmer",
      subject: "Programming",
      summary:
        "Explore a login flow to practice conditions, execution order, and debugging.",
      source:
        "Conditional logic selects a branch based on a condition. A login flow receives input, validates its format, verifies credentials, then returns success or failure. Never log passwords in plain text. Debugging starts by reproducing a problem, locating its cause, modifying the code, and verifying the fix.",
      variable: "",
      unit: "",
      result: "",
      resultUnit: "",
      goal: "",
      explanation: "",
      hint: "",
      context:
        "A colleague suggests logging plain-text passwords to debug a failed login. What do you do?",
      options: [
        "Log every password",
        "Use redacted diagnostics without recording passwords",
        "Skip credential checks",
      ],
      feedback: [
        "Plain-text logs expose sensitive credentials.",
        "Correct. Record the failure stage and redacted diagnostics.",
        "Bypassing validation breaks authentication.",
      ],
      sortTitle: "Design a login flow",
      sortGoal: "Put the login steps in the correct execution order.",
      steps: [
        "Receive user input",
        "Validate input format",
        "Verify credentials",
        "Return success or failure",
      ],
    },
  ],
};
export function example(index: number, lang: Language): Project {
  const c = copy[lang][index]!;
  const scenes: Scene[] = [];
  if (index < 2)
    scenes.push({
      id: "experiment",
      type: "experiment",
      title: lang === "zh" ? "让规律变得可见" : "Make the relationship visible",
      objective: c.goal,
      explanation: c.explanation,
      hint: c.hint,
      quote:
        index === 0
          ? lang === "zh"
            ? "复利是指每一期的收益加入本金，并在下一期继续产生收益。"
            : "Compounding adds each period’s returns to the principal so they can earn returns in the next period."
          : lang === "zh"
            ? "胡克定律指出，在弹性限度内，弹簧弹力的大小与伸长量成正比，即 F = kx。"
            : "Hooke’s law states that within the elastic limit, spring force is proportional to extension: F = kx.",
      variable: c.variable,
      unit: c.unit,
      result_label: c.result,
      result_unit: c.resultUnit,
      min: 0,
      max: index === 0 ? 20 : 0.5,
      step: index === 0 ? 1 : 0.01,
      points: Array.from({ length: index === 0 ? 21 : 6 }, (_, i) => ({
        x: index === 0 ? i : i / 10,
        y: index === 0 ? 10000 * 1.05 ** i : i * 10,
      })),
      target_min: index === 0 ? 15 : 0.3,
      target_max: index === 0 ? 20 : 0.4,
    });
  scenes.push({
    id: "decision",
    type: "decision",
    title: lang === "zh" ? "做一次有依据的选择" : "Make an informed choice",
    objective:
      lang === "zh"
        ? "结合资料，选择最合理的行动。"
        : "Choose an action based on the source.",
    context: c.context,
    options: c.options.map((text, i) => ({
      id: String(i),
      text,
      correct: i === 1,
      feedback: c.feedback[i]!,
    })),
    explanation: c.feedback[1]!,
    hint:
      lang === "zh"
        ? "先找出这个判断成立的前提。"
        : "First identify the assumptions behind the decision.",
    quote: c.source.split(lang === "zh" ? "。" : ". ")[2]!,
  });
  scenes.push({
    id: "sort",
    type: "sort",
    title: c.sortTitle,
    objective: c.sortGoal,
    items: c.steps.map((text, i) => ({ id: String(i), text })),
    correct_order: ["0", "1", "2", "3"],
    explanation: c.steps.join(" → "),
    hint:
      lang === "zh"
        ? "先确定目标或输入，再进行判断和行动，最后检查结果。"
        : "Begin with the goal or input, then act, and check the outcome.",
    quote: c.source
      .split(lang === "zh" ? "。" : ". ")
      .slice(-2)
      .join(lang === "zh" ? "。" : ". "),
  });
  const course: Course = {
    title: c.title,
    subject: c.subject,
    summary: c.summary,
    scenes,
  };
  return {
    id: crypto.randomUUID(),
    source: c.source,
    source_name:
      lang === "zh" ? "WonderLab 精选示例" : "WonderLab curated example",
    source_kind: "example",
    course,
    progress: {
      completed: [],
      active: scenes[0]!.id,
      attempts: {},
      answers: {},
    },
    updated_at: new Date().toISOString(),
  };
}
export const exampleCards = [
  {
    title: ["看见复利的力量", "The power of compounding"],
    subject: ["经济学", "Economics"],
    desc: [
      "时间，如何让微小的积累产生变化？",
      "How does time turn small gains into growth?",
    ],
    color: "green",
    icon: "trend",
    duration: 8,
  },
  {
    title: ["弹簧里的物理规律", "The physics inside a spring"],
    subject: ["自然科学", "Natural science"],
    desc: [
      "拉一拉，亲手发现力与形变的关系。",
      "Stretch, observe, and discover a physical law.",
    ],
    color: "purple",
    icon: "atom",
    duration: 10,
  },
  {
    title: ["像程序员一样思考", "Think like a programmer"],
    subject: ["编程", "Programming"],
    desc: [
      "拆解一个登录流程，练习逻辑与决策。",
      "Break down a login flow and practice logic.",
    ],
    color: "orange",
    icon: "code",
    duration: 6,
  },
];
