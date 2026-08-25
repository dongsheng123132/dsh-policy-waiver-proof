# DSH 临时策略豁免证据

这是 DeepSeek Harness 的离线、确定性证据层，用来核验已经签发的临时策略例外是否严格限定在指定主体、目标版本、作用域、动作白名单、有效期、使用次数和补偿控制内。

它不签发豁免、不修改策略、不批准工具调用，也不执行外部命令。它与执行前规则引擎 `dsh-tool-policy`、策略漂移证明 `dsh-policy-drift-proof`、决策—效果对账 `dsh-decision-effect-proof` 互补，专门回答“这份临时例外有没有被越界使用”。

输入只接受显式 JSON 清单；原始业务正文、凭据和秘密形态字段会被拒绝。输出只保留哈希、计数、布尔检查和机器可读的 `contained` / `breached` 判决。DSH 写盘工具只读取工作区内非符号链接文件，只写入显式 `artifactDir`，并对内容寻址报告执行独占创建和回读校验。

运行 `npm test && npm run check && npm run smoke:plugin && npm run smoke:mcp` 可完成本地验证。
