import { getDataConnect, queryRef, executeQuery, mutationRef, executeMutation } from "firebase/data-connect";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./config.js?v=17";

const participantApp = initializeApp(firebaseConfig, "attendance-answer-token");
const dc = getDataConnect(participantApp, {
  connector: "example", service: "takken-training", location: "asia-northeast1",
});

export const participantAttendance = {
  async load(token) {
    const result = await executeQuery(queryRef(dc, "ParticipantAttendanceAnswer", {
      token,
    }), { fetchPolicy: "SERVER_ONLY" });
    const row = result.data.answer;
    if (!row) throw new Error("回答URLを確認できません。案内メールのURLを開き直すか、事務局へお問い合わせください。");
    if ((row.publicResponses || []).length >= 5001) throw new Error("公開回答の取得上限に達しました。事務局へお問い合わせください。");
    const response = row.response ? {
      ...row.response, answers: JSON.parse(row.response.answersJson || "{}"),
    } : null;
    return { ...row, response, items: (row.items || []).map(item => ({
      ...item, optionList: String(item.options || "").split(",").map(v => v.trim()).filter(Boolean),
    })) };
  },
  async save(token, answers, note) {
    // Identity fields are resolved by SQL; the browser can only submit answers.
    await executeMutation(mutationRef(dc, "SubmitParticipantAttendanceResponse", {
      token, answersJson: JSON.stringify(answers), note,
    }));
  },
};
