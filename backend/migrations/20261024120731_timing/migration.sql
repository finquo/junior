ALTER TABLE "slot" ADD CONSTRAINT slot_no_overlap_teacher_active
    EXCLUDE USING GIST (
        "teacherId" WITH =,
        tstzrange("startTime", "expectedEndTime", '[)') WITH &&
    )
    WHERE (status IN ('scheduled', 'rescheduled', 'started'));
