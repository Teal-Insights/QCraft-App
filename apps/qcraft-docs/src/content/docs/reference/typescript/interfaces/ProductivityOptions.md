---
editUrl: false
next: false
prev: false
title: "ProductivityOptions"
---

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:20](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L20)

## Properties

### oecdGrowthRate?

> `optional` **oecdGrowthRate?**: `number`

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:28](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L28)

Annual OECD productivity growth rate (%) used to project the OECD level.

***

### productivityEnd?

> `optional` **productivityEnd?**: `number`

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:24](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L24)

Long-run convergence target growth rate (%).

***

### productivityStart?

> `optional` **productivityStart?**: `number`

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:22](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L22)

Starting growth rate (%) for logistic convergence.

***

### turningPoint?

> `optional` **turningPoint?**: `number`

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:33](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L33)

Logistic Turning Point (Productivity!J21): the counter value, in years past
`weoMaxYear`. Higher values shift the transition later. Default 15.

***

### weoMaxYear?

> `optional` **weoMaxYear?**: `number`

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:26](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L26)

Last year of WEO/macrofiscal data (typically 2029).
