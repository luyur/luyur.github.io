// ==UserScript==
// @name         标题修改器
// @namespace    *
// @version      7.3
// @description  优化拖拽误触和图标对称性，新增循环点击开启/关闭功能
// @author       Qwen2.5-Max/DeepSeek
// @match        http://202.108.105.232:8282/*
// @grant        GM_registerMenuCommand
// @run-at       none
// @downloadURL https://luyurui.cn/script/title.js
// @updateURL https://luyurui.cn/script/title.js
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    // 预定义样式（新增图标对称性调整）
    const style = document.createElement('style');
    style.textContent = `
        .drag-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: grab;
            display: none;
            align-items: center;
            justify-content: center;
            user-select: none;
        }
        .drag-btn:active {
            cursor: grabbing;
        }
        /* 新增对称铅笔图标 */
        .pencil-icon {
            width: 24px;
            height: 24px;
            transform: translateX(1px);
        }
        .pencil-icon path {
            fill: white;
            stroke: white;
        }
        .modal-dialog {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 999998;
        }
        .modal-input {
            width: 280px;
            padding: 8px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .modal-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .modal-cancel {
            background: #666;
            color: white;
        }
        .modal-confirm {
            background: #4CAF50;
            color: white;
        }
    `;
    document.head.appendChild(style);

    // 创建带对称图标的按钮
    const btn = document.createElement('button');
    btn.className = 'drag-btn';
    btn.innerHTML = `
        <svg class="pencil-icon" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
    `;
    document.body.appendChild(btn);

    // 拖拽逻辑优化（防止误触）
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let btnRect = null;
    let dragThreshold = 3; // 拖动阈值（单位：像素）
    let validClick = true;

    const handleMove = (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // 更新拖拽标志
        if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
            validClick = false;
        }

        let newX = initialLeft + dx;
        let newY = initialTop + dy;

        newX = Math.max(10, Math.min(newX, window.innerWidth - btnRect.width - 10));
        newY = Math.max(10, Math.min(newY, window.innerHeight - btnRect.height - 10));

        btn.style.left = `${newX}px`;
        btn.style.top = `${newY}px`;
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
    };

    const handleUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
    };

    btn.addEventListener('mousedown', (e) => {
        isDragging = true;
        validClick = true;
        startX = e.clientX;
        startY = e.clientY;
        btnRect = btn.getBoundingClientRect();
        initialLeft = btn.offsetLeft;
        initialTop = btn.offsetTop;

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        e.preventDefault();
    });

    // 弹窗逻辑
    const modal = document.createElement('div');
    modal.className = 'modal-dialog';
    modal.innerHTML = `
        <input type="text" class="modal-input" placeholder="输入新标题...">
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button class="modal-button modal-cancel">取消</button>
            <button class="modal-button modal-confirm">确认</button>
        </div>
    `;
    document.body.appendChild(modal);

    // 缓存DOM元素
    const modalInput = modal.querySelector('input');
    const modalCancel = modal.querySelector('.modal-cancel');
    const modalConfirm = modal.querySelector('.modal-confirm');

    // 弹窗显示控制
    const showModal = () => {
        modalInput.value = document.title;
        modal.style.display = 'block';
        modalInput.focus();
        modalInput.select();
    };

    const closeModal = () => {
        modal.style.display = 'none';
        modalInput.value = document.title;
    };

    // 新增功能：循环点击开启/关闭窗口
    let isFunctionEnabled = false; // 默认开启功能

    const toggleFunction = () => {
        isFunctionEnabled = !isFunctionEnabled;
        if (isFunctionEnabled) {
            btn.style.display = 'flex';
            console.log('功能已开启');
        } else {
            btn.style.display = 'none';
            closeModal(); // 关闭弹窗
            console.log('功能已关闭');
        }
    };

    // 点击事件优化（防误触）
    btn.addEventListener('click', (e) => {
        if (validClick && !isDragging) {
            if (e.shiftKey) { // 按住Shift键点击切换功能
                toggleFunction();
            } else {
                showModal();
            }
        }
        validClick = true; // 重置状态
    });

    // 事件委托优化
    modalCancel.addEventListener('click', closeModal);
    modalConfirm.addEventListener('click', () => {
        const newTitle = modalInput.value.trim();
        if (newTitle) document.title = newTitle;
        closeModal();
    });

    // 快捷键优化（增加防冲突检查）
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block') {
            if (e.target.tagName === 'INPUT' && e.key === 'Enter') modalConfirm.click();
            if (e.key === 'Escape') closeModal();
        }
    });

    // 菜单命令
    GM_registerMenuCommand('显示', showModal);
    GM_registerMenuCommand('切换功能', toggleFunction);
})();
