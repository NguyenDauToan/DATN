// ================= RENDER MAIN =================

return (
  <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/40 to-slate-50">
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-4">
      {/* HEADER CHUNG: nút quay lại + tên đề + info */}
      <div className="flex items-center justify-between gap-4">
        {/* Back + tiêu đề */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-slate-200 bg-white/80 hover:bg-slate-50 shadow-sm"
            onClick={() => navigate(isMock ? "/mock-exams" : "/exams")}
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </Button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 truncate">
              {exam.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-500">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                Bài thi trắc nghiệm
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {exam.questions.length} câu hỏi
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                Thời lượng: {exam.duration} phút
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin tiến độ bên phải */}
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            Câu {currentIndex + 1}/{exam.questions.length}
          </span>
          <span className="text-xs text-slate-400">
            {progress.toFixed(0)}% hoàn thành
          </span>
          <div className="w-32">
            <Progress
              value={progress}
              className="h-1.5 rounded-full bg-slate-100"
            />
          </div>
        </div>
      </div>

      {/* HAI CỘT: CÂU HỎI & ĐIỀU HƯỚNG */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* CỘT TRÁI: CHỈ CÒN THẺ CÂU HỎI + NÚT, KHÔNG CÒN CARD TIÊU ĐỀ */}
        <div className="flex-1 space-y-4">
          {/* THẺ CÂU HỎI */}
          <Card className="shadow-lg rounded-3xl bg-white/95 border border-slate-200">
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-3 py-1 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wide text-sky-500 mr-1">
                    Câu
                  </span>
                  <span className="text-sm font-semibold text-sky-700">
                    {currentIndex + 1}
                  </span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] md:text-xs uppercase tracking-wide text-slate-400">
                    {question.type === "multiple_choice" && "Chọn đáp án đúng"}
                    {question.type === "true_false" && "Đúng / Sai"}
                    {question.type === "fill_blank" && "Điền vào chỗ trống"}
                    {question.type === "reading_cloze" &&
                      "Đọc đoạn văn và chọn đáp án cho từng chỗ trống"}
                  </span>

                  <Button
                    type="button"
                    variant={flags[currentIndex] ? "outline" : "ghost"}
                    size="icon"
                    className={`h-8 w-8 rounded-full border flex items-center justify-center ${
                      flags[currentIndex]
                        ? "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        : "border-amber-200 text-amber-500 hover:bg-amber-50"
                    }`}
                    onClick={toggleFlagCurrent}
                    title={
                      flags[currentIndex] ? "Bỏ đánh dấu" : "Đánh dấu xem lại"
                    }
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardTitle
                className={`mt-3 whitespace-pre-line leading-relaxed font-semibold text-slate-900
                ${
                  question.type === "reading_cloze"
                    ? "text-base md:text-lg"
                    : "text-lg md:text-xl"
                }`}
              >
                {question.content}
              </CardTitle>
            </CardHeader>

            {/* ... GIỮ NGUYÊN CardContent như bạn đang có ... */}
            {/* (phần CardContent và các nút chọn đáp án không đổi) */}
            {/* --------- BẮT ĐẦU CardContent --------- */}
            <CardContent className="px-5 pb-5 pt-1 space-y-4">
              {/* toàn bộ logic render reading_cloze / multiple_choice / true_false / fill_blank giữ nguyên ở đây */}
              {/* ... */}
            </CardContent>
            {/* --------- KẾT THÚC CardContent --------- */}
          </Card>

          {/* Nút chuyển câu */}
          <div className="flex justify-between gap-3 pt-2">
            <Button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="flex items-center gap-2 rounded-2xl py-3 px-4 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Câu trước
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-2xl py-3 px-5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-md"
            >
              {currentIndex === exam.questions.length - 1 ? (
                <>
                  <Send className="w-4 h-4" /> Nộp &amp; xem kết quả
                </>
              ) : (
                <>
                  Câu tiếp <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* CỘT PHẢI: ĐIỀU HƯỚNG + ĐỒNG HỒ + NỘP BÀI */}
        <div className="lg:w-64 xl:w-72 w-full lg:sticky lg:top-24 h-fit">
          <Card className="bg-white/90 border border-slate-200 shadow-md rounded-2xl p-4">
            <p className="text-xs font-semibold mb-3 text-slate-600 text-center uppercase tracking-wide">
              Điều hướng câu hỏi
            </p>
            <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-2 justify-items-center">
              {exam.questions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const answered = !!answers[idx];
                const flagged = flags[idx];

                let baseClasses =
                  "relative w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center";
                let stateClasses = "";

                if (isCurrent) {
                  stateClasses =
                    "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow";
                } else if (answered) {
                  stateClasses =
                    "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600 shadow";
                } else {
                  stateClasses =
                    "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`${baseClasses} ${stateClasses}`}
                  >
                    <span>{idx + 1}</span>
                    {flagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="mt-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col items-start gap-1 ml-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest border ${
                    isCriticalTime
                      ? "bg-rose-600 text-white border-rose-700 shadow-md animate-pulse"
                      : "bg-slate-900/5 text-slate-700 border-slate-200"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleSubmitAll}
                className="sm:w-auto w-full flex items-center justify-center gap-2 rounded-2xl border-rose-300 text-rose-600 bg-white hover:bg-rose-50 text-xs md:text-sm"
              >
                <Send className="w-4 h-4" />
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
