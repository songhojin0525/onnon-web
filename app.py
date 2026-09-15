import streamlit as st
import os

st.set_page_config(page_title="ONNON", layout="wide")

# 사이드바에 페이지 선택
page = st.sidebar.radio("페이지 선택", ["홈", "로그인", "관리자", "문제풀기", "계정"])

def load_html(filename):
    filepath = os.path.join('public', filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    return None

if page == "홈":
    html_content = load_html('index.html')
elif page == "로그인":
    html_content = load_html('login.html')
elif page == "관리자":
    html_content = load_html('admin.html')
elif page == "문제풀기":
    html_content = load_html('solve.html')
elif page == "계정":
    html_content = load_html('account.html')

if html_content:
    st.components.v1.html(html_content, height=1000, scrolling=True)
else:
    st.error("페이지를 찾을 수 없습니다")
