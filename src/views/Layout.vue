<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'

</script>

<template>
    <el-container>
        <el-header>
            <el-dropdown placement="bottom-start">
                <span class="el-dropdown-link">
                Dropdown List
                <el-icon class="el-icon--right">
                    <arrow-down />
                </el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item>Action 1</el-dropdown-item>
                        <el-dropdown-item>Action 2</el-dropdown-item>
                        <el-dropdown-item>Action 3</el-dropdown-item>
                        <el-dropdown-item disabled>Action 4</el-dropdown-item>
                        <el-dropdown-item divided>Action 5</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </el-header>
        <el-main>qqweqweqwe<RouterLink to="/login">Login</RouterLink></el-main>
    </el-container>
</template>

<style scoped>
.el-header {
    background-color: #f5f5f5;
    padding: 0 10px;
    margin: 0;
    border-bottom: 1px solid #eee;
    height: 32px;
    display: flex;
    align-items: center;
}
</style>