import axios from "axios";
import {
  Component,
  createEffect,
  createResource,
  createSignal,
  For,
  JSX,
  Match,
  Switch,
} from "solid-js";
import { toPng } from "html-to-image";
import download from "downloadjs";

const WEEKS = 2;

type Holidays = Map<string, string>;
type HolidaysResponse = { [k: string]: string };

const HOLIDAYS_URL = "https://holidays-jp.github.io/api/v1/date.json";
const getHolidays = async (): Promise<Holidays> => {
  const response = await axios.get<HolidaysResponse>(HOLIDAYS_URL);
  return new Map<string, string>(Object.entries(response.data));
};

const DAYS_JP = ["日", "月", "火", "水", "木", "金", "土"] as const;

type CalendarProps = {
  holidays: Holidays;
};

const Calendar: Component<CalendarProps> = (props) => {
  const today = new Date(Date.now());
  const dates = [...Array(WEEKS).keys()].map((week) =>
    [...Array(7).keys()]
      .map((day) => 7 * (week - 1) + day)
      .map(
        (offset) =>
          new Date(
            new Date(today).setDate(today.getDate() - today.getDay() + offset)
          )
      )
  );

  const [ref, setRef] = createSignal<HTMLDivElement | null>(null);
  const [dataUrl, { refetch }] = createResource(
    ref,
    async (el) => await toPng(el)
  );

  createEffect(() => {
    if (dataUrl.loading || dataUrl() === "data:,") {
      refetch();
    } else {
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const filename = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}.png`;
      download(dataUrl(), filename);
    }
  });

  return (
    <div
      ref={(el) => setRef(el)}
      class="w-[2240px] h-[800px] flex flex-col divide-y divide-slate-200 bg-white"
    >
      <For each={dates}>
        {(week) => (
          <div class="flex flex-row divide-x divide-slate-200">
            <For each={week}>
              {(date) => {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const isHoliday = props.holidays.has(
                  `${year}-${month.toString().padStart(2, "0")}-${day
                    .toString()
                    .padStart(2, "0")}`
                );
                const dateStr = `${month}/${day}`;
                const dayStr = DAYS_JP[date.getDay()];
                return (
                  <div class="w-[320px] h-[400px] text-center font-bold proportional-nums">
                    <Switch fallback={<span>{`${dateStr}（${dayStr}）`}</span>}>
                      <Match when={date.getDay() === 0 || isHoliday}>
                        <span class="text-red-600">{`${dateStr}（${dayStr}）`}</span>
                      </Match>
                      <Match when={date.getDay() === 6}>
                        <span class="text-blue-600">{`${dateStr}（${dayStr}）`}</span>
                      </Match>
                    </Switch>
                  </div>
                );
              }}
            </For>
          </div>
        )}
      </For>
    </div>
  );
};

const App: Component = () => {
  const [holidays] = createResource(getHolidays);

  return (
    <>
      {holidays.loading ? (
        <p>Loading...</p>
      ) : (
        <Calendar holidays={holidays()!} />
      )}
    </>
  );
};

export default App;
