"use client";
import { useState, useEffect, useRef } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaArrowUp } from "react-icons/fa";
import { CiChat2, CiUser } from "react-icons/ci";
import { RiRobot2Line } from "react-icons/ri";
import { MdOutlineCleaningServices } from "react-icons/md";
import { v4 as uuidv4 } from "uuid";
import "~/app/styles/chat-bot.css";

interface Message {
  id: string;
  message: string;
  date: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentBotMessage, setCurrentBotMessage] = useState<string>("");

  const chatRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    try {
      const storedUuid = localStorage.getItem("chat_uuid");
      if (!storedUuid) {
        const newUuid = uuidv4();
        localStorage.setItem("chat_uuid", newUuid);
        setUserId(newUuid);
        const initialMessage: Message[] = [
          {
            id: "bot",
            message: "Salom, sizga qanday yordam bera olaman?",
            date: new Date().toISOString(),
          },
        ];
        setMessages(initialMessage);
        localStorage.setItem(
          `chat-messages-${newUuid}`,
          JSON.stringify(initialMessage)
        );
      } else {
        setUserId(storedUuid);
        const storedMessages = localStorage.getItem(
          `chat-messages-${storedUuid}`
        );
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        } else {
          const initialMessage: Message[] = [
            {
              id: "bot",
              message: "Salom, sizga qanday yordam bera olaman?",
              date: new Date().toISOString(),
            },
          ];
          setMessages(initialMessage);
          localStorage.setItem(
            `chat-messages-${storedUuid}`,
            JSON.stringify(initialMessage)
          );
        }
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      try {
        localStorage.setItem(
          `chat-messages-${userId}`,
          JSON.stringify(messages)
        );
      } catch (e) {
        console.error("Error saving messages to localStorage:", e);
      }
    }
  }, [messages, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const toggleVisibility = () => {
    setIsOpen(!isOpen);
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

  const addNewMessage = (newMessage: Message) => {
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const clicked = async () => {
    if (!inputValue.trim()) return;

    try {
      const newMessage: Message = {
        id: userId,
        message: inputValue,
        date: new Date().toISOString(),
      };
      addNewMessage(newMessage);
      setInputValue("");
      setIsWaiting(true);
      setCurrentBotMessage("");

      const response = await fetch("http://192.168.13.147:8000/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          thread_id: userId,
        }),
      });
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let done = false;
        let botMessageContent = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data:")) {
                const jsonDataStr = line.substring(5).trim();
                if (jsonDataStr === "[DONE]") {
                  done = true;
                  break;
                }
                if (jsonDataStr) {
                  try {
                    const jsonData = JSON.parse(jsonDataStr);
                    if (
                      jsonData.type === "token" &&
                      typeof jsonData.content === "string"
                    ) {
                      botMessageContent += jsonData.content;
                      setCurrentBotMessage(botMessageContent);
                    }
                  } catch (e) {
                    console.error("Error parsing JSON:", jsonDataStr, e);
                  }
                }
              }
            }
          }
        }

        if (botMessageContent) {
          const botMessage: Message = {
            id: "bot",
            message: botMessageContent,
            date: new Date().toISOString(),
          };
          addNewMessage(botMessage);
        }

        setIsWaiting(false);
        setCurrentBotMessage("");
      } else {
        console.error("Invalid response body");
        setIsWaiting(false);
        setCurrentBotMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsWaiting(false);
      setCurrentBotMessage("");
    }
  };

  const clearHistory = () => {
    if (window.confirm("Tarixni tozalashni tasdiqlaysizmi?")) {
      setMessages([]);
      localStorage.removeItem(`chat-messages-${userId}`);
      const greeting: Message = {
        id: "bot",
        message: "Salom, sizga qanday yordam bera olaman?",
        date: new Date().toISOString(),
      };
      addNewMessage(greeting);
    }
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

  useEffect(() => {
    const chatContainer = chatRef.current;
    if (chatContainer && isAtBottom) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    const chatContainer = chatRef.current;
    if (chatContainer) {
      const handleScroll = () => {
        const maxScroll =
          chatContainer.scrollHeight - chatContainer.clientHeight;
        setIsAtBottom(chatContainer.scrollTop >= maxScroll - 10);
      };
      chatContainer.addEventListener("scroll", handleScroll);
      return () => {
        chatContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [chatRef]);

  useEffect(() => {
    const handleResize = () => {
      const chatContainer = chatRef.current;
      if (chatContainer) {
        const maxOffset = window.innerWidth - chatContainer.offsetWidth - 30;
        setOffset(Math.max(30, Math.min(offset, maxOffset)));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [offset]);

  useEffect(() => {
    const chatContainer = chatRef.current;
    if (chatContainer) {
      const maxOffset = window.innerWidth - chatContainer.offsetWidth - 30;
      setOffset(Math.max(30, Math.min(offset, maxOffset)));
    }
  }, [chatRef]);

  return (
    <div className="chat-bot-container">
      {isOpen ? (
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
                <div className="chats" ref={chatRef}>
                  {messages.map((msg, index) =>
                    msg.id === userId ? (
                      <div key={msg.id + msg.date} className="chat_body_right">
                        <div className="message_right">{msg.message}</div>
                        <div className="account">
                          <CiUser />
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id + msg.date} className="chat_body">
                        <div className="account">
                          <RiRobot2Line />
                        </div>
                        <div className="message">{msg.message}</div>
                      </div>
                    )
                  )}
                  {isWaiting && (
                    <div className="chat_body">
                      <div className="account">
                        <RiRobot2Line />
                      </div>
                      <div className="message">{currentBotMessage}</div>
                    </div>
                  )}
                </div>
                <div className="form_data">
                  <div className="line"></div>
                  <div className="chat_bar">
                    <div style={{ width: "100%" }}>
                      <input
                        value={inputValue}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            clicked();
                          }
                        }}
                        type="text"
                        placeholder="Xabarni kiriting!"
                        className="input_data"
                      />
                    </div>
                    <div className="clear">
                      <button
                        className={`${
                          !inputValue.trim() || isWaiting
                            ? "disabled_submit_btn"
                            : "submit_btn"
                        }`}
                        disabled={!inputValue.trim() || isWaiting}
                        onClick={clicked}
                      >
                        <FaArrowUp />
                      </button>
                      <button
                        className={`${
                          isWaiting ? "disabled_clear_btn" : "clear_btn"
                        }`}
                        disabled={isWaiting}
                        onClick={clearHistory}
                      >
                        <MdOutlineCleaningServices />
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
          <span className="footer-text">Bizga murojaat qiling!</span>
          <span className="footer-icon">
            <CiChat2 />
          </span>
        </div>
      )}
    </div>
  );
}
