"use client";
import { useState, useEffect } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import "~/app/styles/chat-bot.css";

export default function ChatBot() {
  const [is_open, changeVisible] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);

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
              <IoIosCloseCircleOutline onClick={toggleVisibility} className="icon"/>
            </div>
            <div>
              <div className="header" onMouseDown={handleMouseDown}>
                Xabaringizni bu yerga yozing!
              </div>
              <div className="menu_body">Menu</div>
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
