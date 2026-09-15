import streamlit as st
import os

st.set_page_config(page_title="ONNON", layout="wide")

st.title("ONNON 문제풀이 플랫폼")

# 사이드바에 페이지 선택
page = st.sidebar.radio(
    "페이지",
    ["홈", "로그인", "관리자", "문제풀기", "계정"]
)

def load_html(filename):
    try:
        with open(f'public/{filename}', 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return None

# 페이지별 HTML 로드
pages = {
    "홈": "index.html",
    "로그인": "login.html", 
    "관리자": "admin.html",
    "문제풀기": "solve.html",
    "계정": "account.html"
}

html_content = load_html(pages[page])

if html_content:
    st.components.v1.html(html_content, height=1200, scrolling=True)
else:
    st.error(f"{page} 페이지를 찾을 수 없습니다")
