import requests
from bs4 import BeautifulSoup
import json

# URL с глобальными эмоциями
url = "https://twitchemotes.com/"

# Загружаем HTML-страницу
response = requests.get(url)
if response.status_code == 200:
    soup = BeautifulSoup(response.text, "html.parser")
    print(f"{soup}")
    
    # Найти секцию с эмоциями
    emotes = {}
    for emote_section in soup.select(".emote-name"):
        emote_name = emote_section.find("img")["data-regex"]
        emote_image = emote_section.find("img")["src"]
        emotes[emote_name] = emote_image

    # Сохраняем в JSON
    output_path = "./public/twitch_emotes.json"
    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(emotes, file, indent=4, ensure_ascii=False)
    print(f"JSON сохранен как {output_path}")
else:
    print(f"Не удалось загрузить страницу, статус: {response.status_code}")