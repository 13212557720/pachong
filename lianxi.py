import requests

url = "https://httpbin.org/get"
# 字典自动拼接 ?name=张三&age=20
params = {"name": "张三", "age": 20}
headers = {"User-Agent": "Mozilla/5.0 Chrome/120"}

resp = requests.get(url, params=params, headers=headers, timeout=10)

data = {"username": "admin", "pwd": "123456"}
# resp = requests.post(url, data=data, headers=headers)
# 常用响应属性
# print(resp.status_code)  # 状态码 200
# print(resp.text)        # 文本响应（自动识别编码）
# print(resp.json())      # 直接解析json，返回字典
print(resp.url)         # 完整请求后的url
# print(resp.headers)     # 服务器返回响应头
# print(resp.cookies)     # 响应Cookie
