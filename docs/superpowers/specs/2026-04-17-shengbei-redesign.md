# 圣杯图标和手势测算页面重新设计

**日期**: 2026-04-17  
**状态**: 待实现

## 概述

本次 redesign 主要解决用户测试反馈的三个问题：
1. 圣杯图标样式不够传统，易产生不当联想
2. 手势测算页面显示摄像头画面暴露隐私
3. 手势测算页面圣杯图标尺寸偏小

## 设计方案

### 1. 圣杯图标重新设计

#### 1.1 样式调整
- **布局**: 竖版月牙尖相对（替代当前横版）
- **弧度**: 内侧弧度向内收，更像弯月形状
- **方向**: 两个月牙竖立，尖部相对

#### 1.2 阴阳杯区分（方案A）
- **阳杯**: 全红色，无木纹装饰
- **阴杯**: 全棕色
- **颜色值**:
  - 阳杯红: `#dc2626` 到 `#7f1d1d` (红色渐变)
  - 阴杯棕: `#78350f` 到 `#422006` (棕色渐变)

#### 1.3 组件更新
需要更新的组件：
- `Shengbei.tsx`: 主图标组件，支持阴阳杯变体
- `ShengbeiModal.tsx`: 结果展示中的圣杯
- 其他使用圣杯图标的地方

### 2. 摄像头显示方式调整

#### 2.1 方案选择
完全隐藏摄像头画面，仅显示UI界面。

#### 2.2 实现方式
- 视频元素仍然存在（MediaPipe 需要），但设置为 `display: none`
- 背景改为深色渐变，替代摄像头画面
- 保留所有UI元素：
  - 中央大尺寸圣杯图标
  - 手势提示
  - 状态指示
  - 返回和跳过按钮

#### 2.3 组件更新
- `GestureCamera.tsx`: 修改视频显示逻辑和背景

### 3. 圣杯尺寸调整

#### 3.1 手势测算页面
- 当前尺寸: 200px
- 新尺寸: 300px
- 调整位置: `GestureCamera.tsx` 中的 `<Shengbei size={300} />`

### 4. 结果展示增强

#### 4.1 新增文字说明
在圣杯结果展示区域，添加文字提示：
> "红色为阳杯，棕色为阴杯"

#### 4.2 组件更新
- `ShengbeiModal.tsx`: `ResultDisplay` 组件

## 技术实现要点

### Shengbei 组件 props 扩展
```typescript
interface ShengbeiProps {
  size?: number
  className?: string
  type?: 'default' | 'yang' | 'yin'  // 新增：支持阴阳杯变体
}
```

### GestureCamera 组件修改
- 视频元素添加 `hidden` 或 `className="hidden"`
- 外层容器背景改为深色渐变 `bg-gradient-to-b from-neutral-900 to-black`

## 变更文件清单

1. `frontend/src/components/icons/Shengbei.tsx` - 圣杯图标重设计
2. `frontend/src/components/GestureCamera.tsx` - 隐藏摄像头，调整圣杯尺寸
3. `frontend/src/pages/DailySpeed/ShengbeiModal.tsx` - 结果展示增强，阴阳杯区分

## 验收标准

- [ ] 圣杯图标为竖版月牙尖相对，弧度自然
- [ ] 阳杯全红色，阴杯全棕色
- [ ] 手势测算页面不显示摄像头画面
- [ ] 手势测算页面圣杯尺寸约300px
- [ ] 结果展示时有"红色为阳杯，棕色为阴杯"的文字说明
