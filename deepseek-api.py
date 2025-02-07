from openai import OpenAI
from typing import Generator, List, Dict, Optional

class DeepseekChat:
    def __init__(self, api_key: str):
        """初始化 DeepseekChat 类
        
        Args:
            api_key: SiliconFlow API key
        """
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.siliconflow.cn/v1"
        )
        
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        stream: bool = True,
        max_tokens: int = 4096
    ) -> Generator[Dict[str, str], None, None]:
        """进行对话并返回流式响应
        
        Args:
            messages: 对话历史消息列表
            temperature: 温度参数,控制随机性
            stream: 是否使用流式输出
            max_tokens: 最大输出长度
            
        Returns:
            生成器,返回包含类型和内容的字典
        """
        try:
            response = self.client.chat.completions.create(
                model="deepseek-ai/DeepSeek-R1",
                messages=messages,
                temperature=temperature,
                stream=stream,
                max_tokens=max_tokens
            )
            
            if stream:
                content = ""
                reasoning_content = ""
                for chunk in response:
                    # 获取推理内容
                    if chunk.choices[0].delta.reasoning_content:
                        reasoning_content += chunk.choices[0].delta.reasoning_content
                        yield {
                            "type": "reasoning",
                            "content": chunk.choices[0].delta.reasoning_content
                        }
                    
                    # 获取最终答案
                    if chunk.choices[0].delta.content:
                        content += chunk.choices[0].delta.content
                        yield {
                            "type": "answer",
                            "content": chunk.choices[0].delta.content
                        }
            else:
                # 非流式模式
                content = response.choices[0].message.content
                reasoning_content = response.choices[0].message.reasoning_content
                
                if reasoning_content:
                    yield {
                        "type": "reasoning",
                        "content": reasoning_content
                    }
                yield {
                    "type": "answer",
                    "content": content
                }
                
        except Exception as e:
            yield {
                "type": "error",
                "content": f"发生错误: {str(e)}"
            }

# 测试代码
if __name__ == "__main__":
    # 初始化聊天类
    chat = DeepseekChat(api_key="sk-elthsukfibuwkcttlizqrojpyffskwqziawwqszblhexveqi")
    
    # 测试消息
    test_messages = [
        {
            "role": "user",
            "content": "介绍下cursor这款软件"
        }
    ]
    
    printed_separator = False
    # 获取并打印流式响应
    print("开始对话测试:")
    print("\n=== 推理过程 ===")
    for chunk in chat.chat(test_messages):
        if chunk["type"] == "reasoning":
            print("\033[33m", end="")  # 黄色显示推理过程
            print(chunk["content"], end="", flush=True)
        elif chunk["type"] == "answer":
            if not printed_separator:
                print("\033[0m\n=== 最终答案 ===")
                printed_separator = True
            print(chunk["content"], end="", flush=True)
        elif chunk["type"] == "error":
            print("\033[31m", end="")  # 红色显示错误
            print(chunk["content"])
            print("\033[0m", end="")  # 恢复默认颜色
            
    print("\n\033[0m测试完成")  # 恢复默认颜色