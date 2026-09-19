import type { BriefInput } from "./proposal-schema";

export type CaseEntry = {
  id: string;
  industry: string;
  brand: string;
  tagline: string;
  brief: BriefInput;
};

/**
 * 客户案例库：按行业收录典型品牌的常见需求，
 * 选中后直接填充 Brief，方便快速产出更真实的提案。
 */
export const CASE_LIBRARY: CaseEntry[] = [
  {
    id: "beverage-sparkle",
    industry: "饮料 / 新消费",
    brand: "轻汽 Sparkle",
    tagline: "0 糖气泡水新品上市种草",
    brief: {
      brand: "轻汽 Sparkle",
      clientName: "轻汽(上海)食品科技有限公司",
      city: "上海、北京、广州、深圳",
      industry: "饮料 / 新消费",
      product:
        "0 糖 0 卡气泡水,添加膳食纤维与电解质,主打「好喝不负担」,现有白桃、青柠、西柚三个口味,250ml 细长罐装",
      audience:
        "22-32 岁一二线城市年轻白领,注重身材管理与生活品质,习惯在小红书、抖音获取种草信息,高频购买便利店饮品",
      objective:
        "新品上市 3 个月内建立「健康快乐水」心智,提升品牌认知与电商转化",
      budget: "约 200 万元",
      duration: "8 周",
      style: "xiaohongshu",
    },
  },
  {
    id: "beverage-teahouse",
    industry: "饮料 / 新消费",
    brand: "叶见茶室",
    tagline: "现制茶饮门店拉新与到店客流",
    brief: {
      brand: "叶见茶室",
      clientName: "叶见餐饮管理(杭州)有限公司",
      city: "杭州、南京、苏州",
      industry: "现制茶饮 / 连锁餐饮",
      product:
        "主打原叶鲜奶茶的连锁茶饮品牌,客单价 18-26 元,已有 120 家门店,秋季上新桂花乌龙与烤栗奶茶系列",
      audience:
        "18-28 岁学生与初入职场人群,聚集在校园、写字楼与商圈,爱拍照打卡、对季节限定和联名敏感",
      objective:
        "秋季新品上市带动到店客流与小程序会员增长,拉新会员 10 万,新品销量占比超 30%",
      budget: "约 80 万元",
      duration: "6 周",
      style: "douyin",
    },
  },
  {
    id: "beauty-glowlab",
    industry: "美妆 / 个护",
    brand: "澈研 GlowLab",
    tagline: "功效护肤精华双 11 前种草蓄水",
    brief: {
      brand: "澈研 GlowLab",
      clientName: "澈研生物科技(广州)有限公司",
      city: "全国(重点:上海、成都、武汉)",
      industry: "美妆 / 功效护肤",
      product:
        "主打屏障修护的烟酰胺+神经酰胺精华,299 元/30ml,有第三方临床测试数据支撑,敏感肌可用",
      audience:
        "25-35 岁女性,熬夜与换季易泛红长闭口,会主动研究成分与测评,决策前反复比价与看真人实测",
      objective:
        "双 11 前 2 个月完成种草蓄水,建立「修护有数据」的专业信任,提升天猫旗舰店加购与转化",
      budget: "约 300 万元",
      duration: "10 周",
      style: "xiaohongshu",
    },
  },
  {
    id: "3c-audio",
    industry: "3C / 数码",
    brand: "声域 SonicOne",
    tagline: "开放式耳机新品首发种草",
    brief: {
      brand: "声域 SonicOne",
      clientName: "声域智能科技(深圳)有限公司",
      city: "深圳、北京、上海",
      industry: "3C / 智能硬件",
      product:
        "开放式不入耳蓝牙耳机,699 元,主打久戴不痛、通勤通话清晰、单耳 8 小时续航",
      audience:
        "22-35 岁通勤族与运动人群,入耳式戴久了不适,重视佩戴舒适度与通话质量,习惯看数码测评再下单",
      objective: "首发 6 周内完成品类认知教育,推动京东/天猫首销破 2 万台",
      budget: "约 150 万元",
      duration: "6 周",
      style: "bilibili",
    },
  },
  {
    id: "auto-ev",
    industry: "汽车 / 出行",
    brand: "远行 EV Air",
    tagline: "家用纯电 SUV 上市试驾引流",
    brief: {
      brand: "远行 EV Air",
      clientName: "远行新能源汽车股份有限公司",
      city: "全国一二线城市(重点:长三角、珠三角)",
      industry: "新能源汽车",
      product:
        "20-25 万元级家用纯电 SUV,续航 620km,主打全家出行舒适性、智能座舱与补能网络",
      audience:
        "30-42 岁一二线城市家庭首购或换购用户,关注安全、空间与用车成本,决策周期长、会带家人看车",
      objective: "上市季累计留资 3 万条,到店试驾 8000 组,建立「家用无焦虑」认知",
      budget: "约 600 万元",
      duration: "12 周",
      style: "bilibili",
    },
  },
  {
    id: "edu-kids",
    industry: "教育 / 亲子",
    brand: "小步科学馆",
    tagline: "少儿科学课暑期招生转化",
    brief: {
      brand: "小步科学馆",
      clientName: "小步教育科技(北京)有限公司",
      city: "北京、天津、石家庄",
      industry: "素质教育 / 亲子",
      product:
        "面向 6-12 岁儿童的线下科学实验课,12 节课 2680 元,含动手实验与项目式作品展示",
      audience:
        "30-40 岁一二线城市妈妈为主,重视孩子专注力与动手能力,决策依赖真实上课效果与其他家长口碑",
      objective: "暑期档收集有效线索 5000 条,体验课到店率 40%,正价课转化率 25%",
      budget: "约 60 万元",
      duration: "8 周",
      style: "xiaohongshu",
    },
  },
];

export const CASE_INDUSTRIES = Array.from(
  new Set(CASE_LIBRARY.map((c) => c.industry)),
);
