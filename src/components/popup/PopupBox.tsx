import React from 'react';
import type { NextPage } from "next";

interface PopupBoxProps {
  title: string;
  contents: string;
  items: any[];
  onClose: () => void;
}

export const PopupBox: NextPage<PopupBoxProps> = (props) => {
  return (
    <div className="popup-container">
      <div className="popup">
        <div className="popup-header">
          <h2>{props.title}</h2>
          <button className="close-btn" onClick={props.onClose}>
            X
          </button>
        </div>
        <div className="popup-body">
          {props.contents}
        </div>
        <div className="popup-items">
          {props.items.map((content: any, index: number) => {
            if (typeof content === 'string') {
              return (
                <>
                <div className="popup-item" key={index}>
                  <span className="popup-item-number">{index + 1}. </span>
                  <span className="popup-item-content">{content}</span>
                </div>
                <hr></hr>
                </>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}

export default PopupBox;
