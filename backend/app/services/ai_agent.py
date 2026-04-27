from typing import List
import httpx
import json
from app.core.config import settings
from app.models.schemas import GuanyinStick, Message


class GuanyinAIAgent:
    def __init__(self):
        self.api_key = settings.KIMI_API_KEY
        self.base_url = settings.KIMI_BASE_URL
        self.model = settings.KIMI_MODEL
        self.timeout = settings.KIMI_TIMEOUT
        # Kimi API 是国内的，不需要代理
        self.proxies = None

        # 系统提示词
        self.system_prompt = """你是一位深耕周易命理、精通观音灵签正统释义的专属解签大师，严谨守正、温和通透，你的任务是根据用户抽到的签文和用户的具体问题为用户精准解读签文、解答人生疑惑，不妄言、不篡改、不敷衍。

【零容忍铁律 - 第一条必须遵守】：全程使用中文，禁止出现任何英文！任何英文单词、字母都绝对不允许出现！

## 核心铁律（绝对不可违反）
1. 原文锁死原则
严格沿用内置1-100签固定JSON知识库，严禁修改、编造、删减签号、签名、吉凶、签诗、典故、释义，绝不反转吉凶、篡改本义、偏离核心寓意。
2. 专属定制原则
禁止通用套话、万能模板，完全贴合用户具体问题作答；同签不同问题、同问题不同签文，解读角度、侧重点、措辞必须完全差异化。
3. 知识边界原则
仅调用内置观音灵签知识库，不联网、不编造典故、不延伸无关民俗风水内容。
4. 输出格式原则
回答全程自然呈现加粗效果，直接用加粗格式展示重点内容，不要用多余的引号、符号做标记，干净整洁。

## 解读结构与篇幅规则
1. 首次解读：引用签号+签名+吉凶+签诗原文，再展开解读。
2. 用户追问后：【绝对禁止重复引用签诗原文】，直接围绕签文核心含义回复问题，绝对不要再提任何签诗原文内容。
3. 字数灵活不刻板：问题简单就精简作答，问题复杂就深入解读，长短随心，杜绝固定字数、模板化、机械化感，但一次回复不超过400字。
4. 语气自然流畅、温和有温度，文笔雅致、富有哲理与启发性。

## 标准解读流程
1. 点明签文核心气运与吉凶基调
2. 结合典故精准对应用户问题
3. 针对性解析用户当下处境、趋势、关键点
4. 给出可落地、正向、贴合签文的现实指引
5. 结尾适度安抚与鼓励，不喊空口号

请记住，你是在为用户解答人生疑惑，要认真、用心地对待每一个问题。"""

    async def _call_kimi_api(self, messages: List[dict]) -> str:
        """调用Kimi API"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 1.0,
            "max_tokens": 1000,
        }

        print(f"[Kimi API] Request payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
        print(f"[Kimi API] Proxy config: {self.proxies}")

        async with httpx.AsyncClient(timeout=self.timeout, proxies=self.proxies) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                print(f"[Kimi API] Response status: {response.status_code}")
                print(f"[Kimi API] Response text: {response.text}")
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                print(f"[Kimi API] HTTP error: {e}")
                print(f"[Kimi API] Response body: {e.response.text}")
                raise
            except Exception as e:
                print(f"[Kimi API] Unexpected error: {e}")
                raise

    async def interpret_stick(
        self,
        question: str,
        stick: GuanyinStick
    ) -> str:
        """初次解读签文"""
        user_content = f"""用户抽到的签文：
第{stick.id}签 - {stick.level}
【标题】{stick.title}
【签诗】{stick.poem}
【典故】{stick.story}
【释义】{stick.meaning}

用户的问题：{question}

请为用户解读这支签。"""

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_content},
        ]

        return await self._call_kimi_api(messages)

    async def followup_question(
        self,
        question: str,
        stick: GuanyinStick,
        history: List[Message]
    ) -> str:
        """追问回复"""
        # 构建对话历史 - 追问时额外强化禁止引用签诗的规则
        followup_system_prompt = self.system_prompt + """

【重要！追问模式特别强调】：
这是用户的追问，请务必遵守：
1. 绝对、绝对、绝对不要重复引用签诗原文！
2. 不要提任何签诗中的句子！
3. 直接围绕签文核心含义回答用户问题！"""

        messages = [{"role": "system", "content": followup_system_prompt}]

        # 只添加简洁的签文标识，不重复完整签诗
        context = f"""背景信息：用户之前抽到的是第{stick.id}签 - {stick.level}《{stick.title}》，请结合这支签文的核心含义继续回答用户的后续问题。"""

        messages.append({"role": "user", "content": context})

        # 添加历史对话
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        # 添加当前问题
        messages.append({"role": "user", "content": question})

        return await self._call_kimi_api(messages)


# 单例
ai_agent = GuanyinAIAgent()
