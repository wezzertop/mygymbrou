-- ============================================================================
-- MiGymBrou — RLS para tablas hijas de Rutinas y Nutrición
-- (workout_days, workout_exercises, meal_items, meal_logs)
-- ============================================================================

-- WORKOUT_DAYS
drop policy if exists "Coaches manage own workout days" on public.workout_days;
create policy "Coaches manage own workout days"
  on public.workout_days for all
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_days.workout_id and w.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_days.workout_id and w.coach_id = auth.uid()
    )
  );

drop policy if exists "Students view assigned workout days" on public.workout_days;
create policy "Students view assigned workout days"
  on public.workout_days for select
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_days.workout_id and w.student_id = auth.uid()
    )
  );

-- WORKOUT_EXERCISES
drop policy if exists "Coaches manage own workout exercises" on public.workout_exercises;
create policy "Coaches manage own workout exercises"
  on public.workout_exercises for all
  using (
    exists (
      select 1 from public.workout_days wd
      join public.workouts w on w.id = wd.workout_id
      where wd.id = workout_exercises.workout_day_id and w.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_days wd
      join public.workouts w on w.id = wd.workout_id
      where wd.id = workout_exercises.workout_day_id and w.coach_id = auth.uid()
    )
  );

drop policy if exists "Students view assigned workout exercises" on public.workout_exercises;
create policy "Students view assigned workout exercises"
  on public.workout_exercises for select
  using (
    exists (
      select 1 from public.workout_days wd
      join public.workouts w on w.id = wd.workout_id
      where wd.id = workout_exercises.workout_day_id and w.student_id = auth.uid()
    )
  );

-- MEAL_ITEMS
drop policy if exists "Coaches manage own meal items" on public.meal_items;
create policy "Coaches manage own meal items"
  on public.meal_items for all
  using (
    exists (
      select 1 from public.nutrition_plans np
      where np.id = meal_items.nutrition_plan_id and np.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.nutrition_plans np
      where np.id = meal_items.nutrition_plan_id and np.coach_id = auth.uid()
    )
  );

drop policy if exists "Students view assigned meal items" on public.meal_items;
create policy "Students view assigned meal items"
  on public.meal_items for select
  using (
    exists (
      select 1 from public.nutrition_plans np
      where np.id = meal_items.nutrition_plan_id and np.student_id = auth.uid()
    )
  );

-- MEAL_LOGS
drop policy if exists "Students manage own meal logs" on public.meal_logs;
create policy "Students manage own meal logs"
  on public.meal_logs for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

drop policy if exists "Coaches view students meal logs" on public.meal_logs;
create policy "Coaches view students meal logs"
  on public.meal_logs for select
  using (public.is_coach_of(student_id));
