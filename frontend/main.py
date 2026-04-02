import streamlit as st
from streamlit_option_menu import option_menu

# Your existing imports
from views import home, feed, analytics, setup, accounts

# 1. Page config must stay at the top
st.set_page_config(layout="wide")

# 2. Build the new sidebar menu
with st.sidebar:
    
    # Creates the custom styled menu
    page = option_menu(
        menu_title=None,  # Set to None because we already have st.title above
        options=["Home", "Live Feed", "Consumer Analytics", "Setup", "Accounts"],
        # These are Bootstrap icons (https://icons.getbootstrap.com/)
        icons=["house-door", "broadcast", "graph-up", "gear", "people"], 
        menu_icon="menu-button-wide", 
        default_index=0,
        styles={
            "container": {"padding": "0!important", "background-color": "transparent"},
            "icon": {"color": "#FF4B4B", "font-size": "18px"}, # Streamlit's brand red
            "nav-link": {
                "font-size": "16px", 
                "text-align": "left", 
                "margin": "0px", 
                "--hover-color": "#9E111175" # Light grey hover effect
            },
            "nav-link-selected": {"background-color": "#9E1111", "color": "white"},
        }
    )

# 3. Your existing routing logic works perfectly with it
if page == "Home":
    home.render()

elif page == "Live Feed":
    feed.render()

elif page == "Consumer Analytics":
    analytics.render()

elif page == "Setup":
    setup.render()

elif page == "Accounts":
    accounts.render()