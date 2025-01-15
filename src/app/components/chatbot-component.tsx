"use client";
import { useState, useEffect } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaArrowUp } from "react-icons/fa";
import "~/app/styles/chat-bot.css";

export default function ChatBot() {
  const [is_open, changeVisible] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const isDisabled = !inputValue.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const toggleVisibility = () => {
    changeVisible(!is_open);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      const deltaX = e.clientX - startX;
      let newOffset = offset + deltaX;

      setOffset(newOffset);
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };
  const clicked = () => {
    alert("cascs");
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  return (
    <div className="chat-bot-container">
      {is_open ? (
        <div
          className="parent"
          style={{ transform: `translateX(${offset}px)` }}
        >
          <div className="menu">
            <div className="close">
              <IoIosCloseCircleOutline
                onClick={toggleVisibility}
                className="icon"
              />
            </div>
            <div>
              <div className="header" onMouseDown={handleMouseDown}>
                Xabaringizni bu yerga yozing!
              </div>
              <div className="menu_body">
                <div className="chats">Chat</div>
                <div className="form_data">
                  <div className="line"></div>
                  <div className="chat_bar">
                    <div style={{width: '100%'}}>
                      <input
                        value={inputValue}
                        onChange={handleChange}
                        type="text"
                        placeholder="Xabarni kiriting!"
                        className="input_data"
                      />
                    </div>
                    <div>
                      <button
                        className={`${isDisabled ? "disabled_submit_btn" : "submit_btn"}`}
                        disabled={!inputValue.trim()}
                        onClick={clicked}
                      >
                        <FaArrowUp />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="footer" onClick={toggleVisibility}>
          Bizga murojaat qiling!
        </div>
      )}
    </div>
  );
}
