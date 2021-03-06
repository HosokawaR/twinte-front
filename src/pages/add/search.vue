<template>
  <div class="search">
    <PageHeader>
      <template #left-button-icon>
        <IconButton
          @click="$router.back()"
          size="large"
          color="normal"
          icon-name="arrow_back"
        ></IconButton>
      </template>
      <template #title>授業の検索</template>
    </PageHeader>
    <div class="main">
      <div class="main__search">
        <section class="search__top">
          <div class="top__course-name">
            <TextFieldSingleLine
              v-model.trim="searchWord"
              @enterTextField="search"
              placeholder="科目名または科目番号"
            ></TextFieldSingleLine>
          </div>
          <div class="top__search-button">
            <IconButton
              @click="search"
              @keyup.enter="search"
              iconName="search"
              size="medium"
            ></IconButton>
          </div>
        </section>
        <div class="search__accordion-toggle" @click="toggleOpen">
          条件を指定する
          <span :class="{ 'material-icons': true, '--turned': isAccordionOpen }"
            >expand_more</span
          >
        </div>
        <transition name="spread-down" mode="out-in">
          <section
            class="search__accordion"
            v-if="isAccordionOpen"
            key="accordion"
          >
            <div class="accordion__top-border"></div>
            <div class="accordion__only-blank" @click="toggleOnlyBlank">
              <Checkbox
                :isChecked="onlyBlank"
                @clickCheckbox.stop="toggleOnlyBlank"
              ></Checkbox>
              空いているコマのみを検索
            </div>
            <div class="accordion__shedule-editor">
              <ScheduleEditer
                v-model:schedules="schedules"
                :onClickAddButton="addSchedule"
                :onClickRemoveButton="removeSchedule"
              ></ScheduleEditer>
            </div>
          </section>
          <section class="search__result" v-else key="result">
            <!-- <template v-if="searchResult.length > 0"> -->
            <div
              class="result__row"
              v-for="course in searchResult"
              :key="course.id"
            >
              <CardCourse
                :course="course"
                @click-checkbox="course.isSelected = !course.isSelected"
                @click-syllabus-link="$router.push('/')"
                :isChecked="course.isSelected"
              ></CardCourse>
            </div>
            <!-- </template> -->
            <div class="result__not-found" v-if="isNoResultShow">
              一致する授業がありません。
            </div>
          </section>
        </transition>
      </div>
      <section class="main__button">
        <Button
          @click="addCourse"
          size="large"
          layout="fill"
          color="primary"
          :pauseActiveStyle="false"
          :state="btnState"
          >選択した授業を追加</Button
        >
      </section>
    </div>
    <Modal
      v-if="duplicationModal"
      class="duplication-modal"
      @click="closeDuplicationModal"
    >
      <template #title>開講時限が重複しています</template>
      <template #contents>
        <p class="modal__text">
          以下の授業のコマには既に授業が登録されています。そのまま追加してよろしいですか？（当該のコマには複数の授業が登録されます。）
        </p>
        <div class="modal__courses">
          <div
            class="duplicated-course"
            v-for="data in duplicatedCourses"
            :key="data.name"
          >
            <p class="duplicated-course__name">{{ data.name }}</p>
            <CourseDetailMini
              class="duplicated-course__detail"
              iconName="schedule"
              :text="data.period"
            ></CourseDetailMini>
          </div>
        </div>
      </template>
      <template #button>
        <Button
          @click="closeDuplicationModal"
          size="medium"
          layout="fill"
          color="base"
          >キャンセル</Button
        >
        <Button
          @click="addCourse(true)"
          size="medium"
          layout="fill"
          color="primary"
          >そのまま追加</Button
        >
      </template>
    </Modal>
  </div>
</template>

<script lang="ts">
import { CourseCard, dummyCourseCard } from "~/entities/courseCard";
import { defineComponent, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useSwitch } from "~/hooks/useSwitch";
import { useToggle } from "@vueuse/core";
import Button from "~/components/Button.vue";
import CardCourse from "~/components/CardCourse.vue";
import Checkbox from "~/components/Checkbox.vue";
import CourseDetailMini from "~/components/CourseDetailMini.vue";
import IconButton from "~/components/IconButton.vue";
import Modal from "~/components/Modal.vue";
import PageHeader from "~/components/PageHeader.vue";
import ScheduleEditer from "~/components/ScheduleEditer.vue";
import TextFieldSingleLine from "~/components/TextFieldSingleLine.vue";
import { Schedule } from "~/entities/schedule";

export default defineComponent({
  components: {
    Button,
    CardCourse,
    Checkbox,
    CourseDetailMini,
    IconButton,
    Modal,
    PageHeader,
    ScheduleEditer,
    TextFieldSingleLine,
  },
  setup() {
    const router = useRouter();

    /** accordion */
    const [isAccordionOpen, toggleOpen] = useToggle();

    /** search option */
    const [onlyBlank, toggleOnlyBlank] = useToggle();

    /** schedule-editor */
    const schedules = ref<Schedule[]>([
      { module: "指定なし", day: "指定なし", period: "指定なし" },
    ]);
    const scheduleMax = 4;
    const scheduleMin = 1;
    const addSchedule = () => {
      if (schedules.value.length >= scheduleMax) return;
      schedules.value.push({
        module: "指定なし",
        day: "指定なし",
        period: "指定なし",
      });
    };
    const removeSchedule = (index: number) => {
      if (schedules.value.length <= scheduleMin) return;
      schedules.value.splice(index, 1);
    };

    /** result */
    const searchResult = ref<CourseCard[]>([]);

    /** top */
    const isNoResultShow = ref(false);
    const searchWord = ref("");
    const search = () => {
      isAccordionOpen.value = false;
      // デモ用の動作
      if (searchWord.value === "色彩") {
        isNoResultShow.value = false;
        searchResult.value = dummyCourseCard;
      } else {
        isNoResultShow.value = true;
        searchResult.value = [];
      }
    };

    /** button */
    const btnState = computed(() => {
      if (searchResult.value.some((v) => v.isSelected === true))
        return "default";
      else return "disabled";
    });
    const [
      duplicationModal,
      openDuplicationModal,
      closeDuplicationModal,
    ] = useSwitch();
    const duplicated = ref(true);
    const addCourse = (force: boolean = false) => {
      if (btnState.value == "disabled") return;
      if (!duplicated.value || force) {
        router.push("/");
      } else {
        openDuplicationModal();
      }
    };
    const duplicatedCourses = [
      { name: "色彩計画演習", period: "春A 水2" },
      { name: "色彩学", period: "春B 水2" },
    ];

    return {
      addCourse,
      addSchedule,
      btnState,
      closeDuplicationModal,
      duplicatedCourses,
      duplicationModal,
      isAccordionOpen,
      isNoResultShow,
      onlyBlank,
      openDuplicationModal,
      removeSchedule,
      schedules,
      search,
      searchResult,
      searchWord,
      toggleOnlyBlank,
      toggleOpen,
    };
  },
});
</script>

<style scoped lang="scss">
@import "~/scss/main.scss";
.search {
  @include max-width;
}

.main {
  margin-top: $spacing-5;
  &__search {
    height: calc(100vh - 16.2rem);
    padding: $spacing-3 $spacing-0 $spacing-0;
  }
  &__button {
    text-align: center;
    margin: $spacing-3 $spacing-0 $spacing-6;
    @include landscape {
      margin-bottom: $spacing-7;
    }
  }
  .button {
    display: inline-block;
  }
}

.search {
  &__top {
    display: flex;
    margin-bottom: $spacing-5;
  }
  &__accordion-toggle {
    @include text-button;
    @include button-cursor;
    display: table;
    margin: $spacing-0 $spacing-0 $spacing-6 auto;
    .material-icons {
      margin-left: $spacing-1;
      transition: $transition-transform;
      &.--turned {
        transform: rotate(-180deg);
      }
    }
  }
  &__result {
    height: calc(100vh - 26.6rem);
    @include scroll-mask;
    overflow-y: auto;
    padding: $spacing-2;
  }
}

.top {
  &__course-name {
    width: 100%;
    margin-right: $spacing-2;
  }
}

.accordion {
  &__top-border {
    width: 100%;
    height: 0.4rem;
    margin-bottom: $spacing-4;
    box-shadow: $shadow-input-concave;
    border-radius: $radius-1;
  }
  &__only-blank {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-6;
    div {
      margin-right: $spacing-4;
    }
  }
}

.result {
  &__row {
    margin-bottom: $spacing-3;
  }
  &__not-found {
    color: $disabled;
  }
}

.duplication-modal .modal {
  &__text {
    line-height: $multi-line;
    margin-bottom: 3rem;
  }
  &__courses {
    display: grid;
    gap: $spacing-4;
  }
  .button {
    width: calc(50% - $spacing-3);
    &:first-child {
      margin-right: $spacing-3;
    }
    &:last-child {
      margin-left: $spacing-3;
    }
  }
}

.duplicated-course {
  @include center-flex(column);
  align-items: flex-start;
  &__name {
    font-weight: 500;
    line-height: $single-line;
    margin-bottom: $spacing-1;
  }
}
</style>
