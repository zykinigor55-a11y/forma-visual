import assert from "node:assert/strict";
import {artifactIntent,buildRussianPdf} from "./chat-artifacts-v14.mjs";
assert.equal(artifactIntent("Нарисуй изображение современного дома"),"image");
assert.equal(artifactIntent("Сделай PDF-презентацию проекта дома"),"pdf");
assert.equal(artifactIntent("Нужен пдф альбос с фото, как убрать кротов"),"pdf");
assert.equal(artifactIntent("Сделай пдф доклад про собак шпицов"),"pdf");
assert.equal(artifactIntent("PDF альбом про собак"),"pdf");
assert.equal(artifactIntent("Фото слона в сапогах создай"),"image");
assert.equal(artifactIntent("Что такое PDF?"),null);

assert.equal(artifactIntent("Как создать PDF?"),null);
assert.equal(artifactIntent("Напиши промпт для изображения"),null);
assert.equal(artifactIntent("Полосатая корова фото"),"image","noun-photo prompt must use real generator");
assert.equal(artifactIntent("Фото полосатой коровы"),"image");
assert.equal(artifactIntent("Нарисуй полосатую корову"),"image");
assert.equal(artifactIntent("Покажи, как сделать фото?"),null);
assert.equal(artifactIntent("Объясни создание картинки"),null);
assert.equal(artifactIntent("Сделай фото"),"image");
const pdf=await buildRussianPdf({
 title:"Тестовый проект ПЛЮХ",subtitle:"Техническая проверка PDF",
 sections:[{heading:"Введение",paragraphs:["Привет! Проверка русского шрифта и создания документа."]}]
});
assert.equal(pdf.toString("ascii",0,5),"%PDF-");
assert.ok(pdf.length>1500);
console.log("PLUX V14 PDF smoke test passed; bytes="+pdf.length);
