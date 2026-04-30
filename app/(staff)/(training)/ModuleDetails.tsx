// app/(staff)/(training)/ModuleDetails.tsx - FIXED & ENHANCED VERSION
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Dimensions,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import Toast from "react-native-toast-message";
import { staffApiClient, LearningModule } from "@/app/lib/staffApiClient";

const { width: screenWidth } = Dimensions.get("window");

// Enhanced image URL validator
const getSafeImageUrl = (url: any): string => {
  if (!url || typeof url !== "string") {
    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  }

  // Basic URL validation
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Invalid+URL";
};

// ==================== ENHANCED INTERFACES ====================
interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  _id?: string;
  id?: string;
  question: string;
  questionType: "multiple-choice" | "true-false" | "short-answer";
  options: QuizOption[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  order: number;
  isActive: boolean;
}

interface YouTubeVideo {
  _id: string;
  title: string;
  url: string;
  videoUrl?: string;
  description?: string;
  type: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  duration?: string;
  thumbnail?: string;
}

interface Resource {
  _id: string;
  title: string;
  url: string;
  description?: string;
  type: "youtube" | "website" | "document";
  isActive: boolean;
  order: number;
  createdAt: string;
  fileType?: string;
  displayUrl?: string;
}

interface ModuleQuiz {
  isEnabled: boolean;
  title?: string;
  description?: string;
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
  questions?: QuizQuestion[];
  totalPoints: number;
  showResults: boolean;
  randomizeQuestions: boolean;
  allowRetakes: boolean;
  requiredForCompletion: boolean;
}

interface ExtendedLearningModule extends Omit<LearningModule, "duration"> {
  id?: string;
  hasQuiz?: boolean;
  duration?: number;
  status?: "Active" | "Inactive" | "Draft" | undefined;
  progress?: number;
  youtubeVideos?: YouTubeVideo[];
  resources?: Resource[];
  quiz?: ModuleQuiz;
}

type ModuleDetailsParams = {
  moduleId: string;
  moduleTitle: string;
  moduleDescription: string;
  moduleCategory: string;
  moduleInstructor: string;
  moduleCoverImage: string;
  moduleDuration: string;
  moduleDifficulty: string;
  moduleHasQuiz: string;
  moduleRequirements: string;
  moduleLearningObjectives: string;
  moduleProgress: string;
  moduleYoutubeVideos: string;
  moduleResources: string;
  moduleStatus: string;
  moduleQuiz: string;
  moduleQuizAnalytics: string;
};

// ==================== ENHANCED HELPER FUNCTIONS ====================
const getYouTubeVideoId = (url: string | undefined | null): string | null => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/shorts\/([^&\?\/]+)/,
  ];

  for (const pattern of patterns) {
    try {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    } catch (error) {
      console.log("Error matching YouTube pattern:", error);
    }
  }

  return null;
};

const getFileTypeFromUrl = (url: string): string => {
  if (!url) return "unknown";

  const extension = url.split(".").pop()?.toLowerCase() || "";
  const urlWithoutParams = url.split("?")[0];
  const fileName = urlWithoutParams.split("/").pop()?.toLowerCase() || "";

  if (fileName.includes(".pdf") || extension === "pdf") return "PDF Document";
  if (fileName.includes(".doc") || extension === "doc" || extension === "docx")
    return "Word Document";
  if (fileName.includes(".xls") || extension === "xls" || extension === "xlsx")
    return "Excel Spreadsheet";
  if (fileName.includes(".ppt") || extension === "ppt" || extension === "pptx")
    return "PowerPoint Presentation";
  if (fileName.includes(".txt") || extension === "txt") return "Text File";
  if (fileName.includes(".zip") || extension === "zip" || extension === "rar")
    return "Compressed File";

  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension))
    return "Image File";

  return "Document";
};

const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;

  const trimmedUrl = url.trim();
  if (trimmedUrl.length < 3) return false;

  try {
    const urlWithProtocol = trimmedUrl.startsWith("http")
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    new URL(urlWithProtocol);
    return true;
  } catch {
    return false;
  }
};

const formatUrlForDisplay = (url: string): string => {
  if (!url) return "";

  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url.length > 50 ? url.substring(0, 50) + "..." : url;
  }
};

// ==================== ENHANCED DATA NORMALIZATION ====================
const normalizeModuleData = (
  params: ModuleDetailsParams
): ExtendedLearningModule => {
  const safeParse = (jsonString: string | any, fallback: any) => {
    if (typeof jsonString === "string") {
      try {
        return JSON.parse(jsonString || JSON.stringify(fallback));
      } catch {
        return fallback;
      }
    }
    return jsonString || fallback;
  };

  const duration = parseInt(params.moduleDuration) || 60;
  const difficulty =
    params.moduleDifficulty === "beginner" ||
    params.moduleDifficulty === "intermediate" ||
    params.moduleDifficulty === "advanced"
      ? params.moduleDifficulty
      : "beginner";

  const status =
    params.moduleStatus === "Active" ||
    params.moduleStatus === "Inactive" ||
    params.moduleStatus === "Draft"
      ? params.moduleStatus
      : undefined;

  const progressStatus = params.moduleProgress
    ? parseInt(params.moduleProgress) === 100
      ? "completed"
      : parseInt(params.moduleProgress) > 0
      ? "in-progress"
      : "not-started"
    : "not-started";

  // Enhanced resource parsing with better error handling
  const rawResources = safeParse(params.moduleResources, []);
  const enhancedResources = Array.isArray(rawResources)
    ? rawResources
        .filter((r: any) => r && r.url && r.title && isValidUrl(r.url))
        .map((resource: any) => ({
          _id: resource._id || resource.id || `resource_${Date.now()}`,
          title: resource.title || "Untitled Resource",
          url: resource.url,
          description: resource.description || "",
          type:
            resource.type ||
            (resource.url.includes("youtube") ? "youtube" : "website"),
          isActive: resource.isActive !== false,
          order: resource.order || 0,
          createdAt: resource.createdAt || new Date().toISOString(),
          fileType: getFileTypeFromUrl(resource.url),
          displayUrl: formatUrlForDisplay(resource.url),
        }))
    : [];

  // Parse YouTube videos separately with enhanced validation
  const rawVideos = safeParse(params.moduleYoutubeVideos, []);
  const youtubeVideos = Array.isArray(rawVideos)
    ? rawVideos
        .filter(
          (v: any) =>
            v &&
            (v.url || v.videoUrl) &&
            v.title &&
            isValidUrl(v.url || v.videoUrl)
        )
        .map((video: any) => ({
          _id: video._id || video.id || `video_${Date.now()}`,
          title: video.title || "Untitled Video",
          url: video.url || video.videoUrl,
          videoUrl: video.videoUrl || video.url,
          description: video.description || "",
          type: "youtube",
          isActive: video.isActive !== false,
          order: video.order || 0,
          createdAt: video.createdAt || new Date().toISOString(),
          duration: video.duration || "10:00",
          thumbnail: video.thumbnail || "",
        }))
    : [];

  return {
    _id: params.moduleId || "",
    id: params.moduleId || "",
    title: params.moduleTitle || "Untitled Module",
    description: params.moduleDescription || "No description available",
    category: params.moduleCategory || "General",
    instructor: {
      name: "SandreaLee Salon",
      bio: "Professional beauty and salon training experts",
      profileImage: "",
      credentials: ["Certified Beauty Professionals", "Industry Experts"],
    },
    coverImage: "",
    duration: duration,
    difficulty: difficulty,
    hasQuiz: params.moduleHasQuiz === "true",
    requirements: safeParse(params.moduleRequirements, []),
    learningObjectives: safeParse(params.moduleLearningObjectives, []),
    progress: parseInt(params.moduleProgress) || 0,
    youtubeVideos: youtubeVideos,
    resources: enhancedResources,
    status: status,
    quiz: safeParse(params.moduleQuiz, {
      isEnabled: false,
      questions: [],
      passingScore: 70,
      timeLimit: 30,
      maxAttempts: 3,
      totalPoints: 0,
      showResults: true,
      randomizeQuestions: false,
      allowRetakes: true,
      requiredForCompletion: true,
    }),
    quizAnalytics: safeParse(params.moduleQuizAnalytics, {}),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userProgress: {
      status: progressStatus,
      progress: parseInt(params.moduleProgress) || 0,
    } as any,
  };
};

// ==================== ENHANCED RESOURCE VIEWER COMPONENT ====================
const ResourceViewer = ({
  resource,
  visible,
  onClose,
}: {
  resource: Resource | null;
  visible: boolean;
  onClose: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError("Failed to load resource");
  };

  const handleOpenInBrowser = async () => {
    if (resource?.url) {
      try {
        const canOpen = await Linking.canOpenURL(resource.url);
        if (canOpen) {
          await Linking.openURL(resource.url);
          onClose();
        } else {
          setError("Cannot open this resource in browser");
        }
      } catch {
        setError("Error opening resource");
      }
    }
  };

  const getResourceIcon = () => {
    switch (resource?.type) {
      case "document":
        return "document-text";
      case "website":
        return "globe";
      case "youtube":
        return "logo-youtube";
      default:
        return "document";
    }
  };

  const getResourceTitle = () => {
    switch (resource?.type) {
      case "document":
        return resource.fileType || "Document";
      case "website":
        return "Web Page";
      case "youtube":
        return "YouTube Video";
      default:
        return "Resource";
    }
  };

  const getDocumentUrl = (url: string): string => {
    if (url.toLowerCase().includes(".pdf")) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        url
      )}`;
    }
    return url;
  };

  if (!resource) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet">
      <SafeAreaView style={styles.resourceModalContainer}>
        {/* Enhanced Header */}
        <View style={styles.resourceModalHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.resourceModalCloseButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.resourceModalHeaderContent}>
            <Ionicons name={getResourceIcon()} size={20} color="#619AE4" />
            <Text style={styles.resourceModalType}>{getResourceTitle()}</Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenInBrowser}
            style={styles.resourceModalActionButton}>
            <Ionicons name="open-outline" size={20} color="#619AE4" />
          </TouchableOpacity>
        </View>

        {/* Enhanced Content */}
        <View style={styles.resourceModalContent}>
          <Text style={styles.resourceModalTitle}>{resource.title}</Text>
          {resource.description && (
            <Text style={styles.resourceModalDescription}>
              {resource.description}
            </Text>
          )}

          {/* Enhanced URL Display */}
          {(resource.type === "website" || resource.type === "document") && (
            <View style={styles.urlDisplayContainer}>
              <Ionicons name="link" size={16} color="#619AE4" />
              <Text style={styles.urlDisplayText} numberOfLines={1}>
                {resource.displayUrl || formatUrlForDisplay(resource.url)}
              </Text>
            </View>
          )}

          {loading && (
            <View style={styles.resourceLoadingContainer}>
              <ActivityIndicator size="large" color="#619AE4" />
              <Text style={styles.resourceLoadingText}>
                Loading {resource.type === "document" ? "document" : "resource"}
                ...
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.resourceErrorContainer}>
              <Ionicons name="warning-outline" size={48} color="#EF4444" />
              <Text style={styles.resourceErrorText}>{error}</Text>
              <TouchableOpacity
                onPress={handleOpenInBrowser}
                style={styles.resourceErrorButton}>
                <Text style={styles.resourceErrorButtonText}>
                  Open in Browser
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {resource.type === "website" && !error && (
            <WebView
              source={{ uri: resource.url }}
              style={styles.webView}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState={true}
            />
          )}

          {resource.type === "document" && !error && (
            <WebView
              source={{ uri: getDocumentUrl(resource.url) }}
              style={styles.webView}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              startInLoadingState={true}
            />
          )}

          {resource.type === "youtube" && !error && (
            <WebView
              source={{
                uri: `https://www.youtube.com/embed/${getYouTubeVideoId(
                  resource.url
                )}?rel=0`,
              }}
              style={styles.webView}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ==================== ENHANCED MAIN COMPONENT ====================
export default function ModuleDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<ModuleDetailsParams>();
  const normalizedData = normalizeModuleData(params);

  // Enhanced State Management
  const [fullModuleData, setFullModuleData] =
    useState<ExtendedLearningModule | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "videos" | "resources" | "quiz"
  >("overview");
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizResultsModalVisible, setQuizResultsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // FIXED: Timer state using number type
  const [quizTimer, setQuizTimer] = useState<number | null>(null);

  // Enhanced Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // FIXED: Enhanced data normalization with safety checks
  const getCompleteModuleData = (): ExtendedLearningModule => {
    if (fullModuleData) {
      // Ensure quiz questions have proper structure with safety checks
      const normalizedQuiz = fullModuleData.quiz
        ? {
            ...fullModuleData.quiz,
            questions: (fullModuleData.quiz.questions || []).map((q: any) => ({
              _id: q._id || q.id || `question_${Date.now()}`,
              id: q.id || q._id || `question_${Date.now()}`,
              question: q.question || "No question text available",
              questionType: q.questionType || "multiple-choice",
              options: q.options || [],
              correctAnswer: q.correctAnswer || "",
              explanation: q.explanation || "",
              points: q.points || 1, // Default to 1 point if missing
              order: q.order || 0,
              isActive: q.isActive !== false,
            })),
          }
        : undefined;

      return {
        ...fullModuleData,
        id: fullModuleData._id || fullModuleData.id || normalizedData.id,
        hasQuiz: fullModuleData.hasQuiz ?? !!fullModuleData.quiz?.isEnabled,
        youtubeVideos: fullModuleData.youtubeVideos ?? [],
        resources: fullModuleData.resources ?? [],
        quiz: normalizedQuiz ?? {
          isEnabled: false,
          questions: [],
          passingScore: 70,
          timeLimit: 30,
          maxAttempts: 3,
          totalPoints: 0,
          showResults: true,
          randomizeQuestions: false,
          allowRetakes: true,
          requiredForCompletion: true,
        },
        progress: fullModuleData.progress ?? 0,
        duration: fullModuleData.duration ?? 60,
        status: fullModuleData.status,
      };
    }
    return normalizedData;
  };

  const moduleData = getCompleteModuleData();

  // Enhanced Quiz State
  const [quizAttempt, setQuizAttempt] = useState({
    currentQuestion: 0,
    answers: [] as string[],
    timeRemaining: (moduleData.quiz?.timeLimit || 30) * 60,
    startTime: new Date(),
  });
  const [quizResults, setQuizResults] = useState<any>(null);
  const [videoProgress, setVideoProgress] = useState<{
    [key: string]: boolean;
  }>({});
  const [resourceProgress, setResourceProgress] = useState<{
    [key: string]: boolean;
  }>({});

  // Enhanced Data Fetching
  const fetchModuleDetails = useCallback(async () => {
    if (!normalizedData.id || fullModuleData) return;
    try {
      setModuleLoading(true);
      const response = await staffApiClient.getTrainingModule(
        normalizedData.id
      );
      if (response.success) {
        const apiData = response.data;
        const fetchedData: ExtendedLearningModule = {
          ...apiData,
          id: apiData._id,
          hasQuiz: !!apiData.quiz?.isEnabled,
          youtubeVideos: apiData.youtubeVideos ?? [],
          resources: (apiData.resources ?? []).map((resource: any) => ({
            ...resource,
            fileType: getFileTypeFromUrl(resource.url),
            displayUrl: formatUrlForDisplay(resource.url),
          })),
          quiz: apiData.quiz
            ? {
                ...apiData.quiz,
                questions: (apiData.quiz.questions || []).map((q: any) => ({
                  ...q,
                  points: q.points || 1, // Ensure points has a default value
                  options: q.options || [], // Ensure options array exists
                })),
              }
            : {
                isEnabled: false,
                questions: [],
                passingScore: 70,
                timeLimit: 30,
                maxAttempts: 3,
                totalPoints: 0,
                showResults: true,
                randomizeQuestions: false,
                allowRetakes: true,
                requiredForCompletion: true,
              },
          progress: apiData.progress ?? 0,
          duration:
            typeof apiData.duration === "string"
              ? parseInt(apiData.duration) || 60
              : apiData.duration,
        };
        setFullModuleData(fetchedData);

        // Animate content in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error("Error fetching module details:", error);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Failed to load complete module data",
      });
    } finally {
      setModuleLoading(false);
    }
  }, [normalizedData.id, fullModuleData, fadeAnim, slideAnim]);

  useEffect(() => {
    fetchModuleDetails();
  }, [fetchModuleDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    setFullModuleData(null);
    await fetchModuleDetails();
    setRefreshing(false);
    Toast.show({
      type: "success",
      text1: "Refreshed",
      text2: "Module data updated successfully!",
    });
  };

  // Enhanced Video Handling
  const handleVideoPress = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
    setVideoProgress((prev) => ({ ...prev, [video._id]: true }));
  };

  const handleCloseVideo = () => {
    setVideoModalVisible(false);
    setTimeout(() => setSelectedVideo(null), 300);
  };

  // Enhanced Resource Handling
  const handleResourcePress = async (resource: Resource) => {
    setResourceProgress((prev) => ({ ...prev, [resource._id]: true }));

    if (resource.type === "youtube") {
      const videoResource: YouTubeVideo = {
        _id: resource._id,
        title: resource.title,
        url: resource.url,
        description: resource.description,
        type: "youtube",
        isActive: true,
        order: 0,
        createdAt: resource.createdAt || new Date().toISOString(),
      };
      handleVideoPress(videoResource);
    } else {
      if (!isValidUrl(resource.url)) {
        Toast.show({
          type: "error",
          text1: "Invalid URL",
          text2: "This resource URL appears to be invalid",
        });
        return;
      }

      setSelectedResource(resource);
      setResourceModalVisible(true);
    }
  };

  const handleOpenResourceInBrowser = async (resource: Resource) => {
    try {
      if (!isValidUrl(resource.url)) {
        Toast.show({
          type: "error",
          text1: "Invalid URL",
          text2: "Cannot open this resource URL",
        });
        return;
      }

      const canOpen = await Linking.canOpenURL(resource.url);
      if (canOpen) {
        await Linking.openURL(resource.url);
        Toast.show({
          type: "success",
          text1: "Opening Resource",
          text2: `Opening ${resource.title} in browser`,
        });

        setResourceProgress((prev) => ({ ...prev, [resource._id]: true }));
      } else {
        Toast.show({
          type: "error",
          text1: "Cannot Open",
          text2: "Unable to open this resource",
        });
      }
    } catch (error) {
      console.error("Error opening resource:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to open resource",
      });
    }
  };

  const handleCloseResource = () => {
    setResourceModalVisible(false);
    setTimeout(() => setSelectedResource(null), 300);
  };

  // FIXED: Enhanced Quiz Handling with safety checks and proper timer
  const handleStartQuiz = () => {
    if (!moduleData.quiz?.isEnabled || !moduleData.quiz.questions?.length) {
      Toast.show({
        type: "error",
        text1: "No Quiz Available",
        text2: "This module doesn't have an active quiz",
      });
      return;
    }

    // Initialize answers array with empty strings
    const initialAnswers = new Array(moduleData.quiz.questions.length).fill("");

    setQuizAttempt({
      currentQuestion: 0,
      answers: initialAnswers,
      timeRemaining: (moduleData.quiz.timeLimit || 30) * 60,
      startTime: new Date(),
    });
    setQuizModalVisible(true);

    // FIXED: Using number type for timer
    const timer = setInterval(() => {
      setQuizAttempt((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    setQuizTimer(timer);
  };

  const handleQuizAnswer = (answer: string) => {
    const newAnswers = [...quizAttempt.answers];
    newAnswers[quizAttempt.currentQuestion] = answer;
    setQuizAttempt({ ...quizAttempt, answers: newAnswers });
  };

  // FIXED: Safe navigation functions
  const handleNextQuestion = () => {
    if (
      moduleData.quiz?.questions &&
      quizAttempt.currentQuestion < moduleData.quiz.questions.length - 1
    ) {
      const nextQuestion =
        moduleData.quiz.questions[quizAttempt.currentQuestion + 1];
      if (nextQuestion) {
        setQuizAttempt({
          ...quizAttempt,
          currentQuestion: quizAttempt.currentQuestion + 1,
        });
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (quizAttempt.currentQuestion > 0) {
      const prevQuestion =
        moduleData.quiz?.questions?.[quizAttempt.currentQuestion - 1];
      if (prevQuestion) {
        setQuizAttempt({
          ...quizAttempt,
          currentQuestion: quizAttempt.currentQuestion - 1,
        });
      }
    }
  };

  const handleSubmitQuiz = async () => {
    // FIXED: Proper timer cleanup
    if (quizTimer !== null) {
      clearInterval(quizTimer);
      setQuizTimer(null);
    }

    if (!moduleData.quiz?.questions) return;

    let correctAnswers = 0;
    const questionResults = moduleData.quiz.questions.map((question, index) => {
      const userAnswer = quizAttempt.answers[index] || "";
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: question._id || `question-${index}`,
        selectedAnswer: userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? question.points || 1 : 0,
      };
    });

    const totalQuestions = moduleData.quiz.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const timeSpent = Math.floor(
      (new Date().getTime() - quizAttempt.startTime.getTime()) / 1000
    );
    const passed = score >= (moduleData.quiz.passingScore || 70);

    const results = {
      score,
      correctAnswers,
      totalQuestions,
      timeSpent,
      passed,
      answers: questionResults,
    };

    setQuizResults(results);
    setQuizModalVisible(false);
    setQuizResultsModalVisible(true);

    try {
      await staffApiClient.submitQuizAttempt(moduleData._id, {
        answers: questionResults.map(
          ({ questionId, selectedAnswer, isCorrect }) => ({
            questionId,
            selectedAnswer,
            isCorrect,
          })
        ),
        score,
        correctAnswers,
        totalQuestions,
        timeSpent,
        passed,
      });
      Toast.show({
        type: passed ? "success" : "info",
        text1: passed ? "Quiz Passed!" : "Quiz Completed",
        text2: `Your score: ${score}%`,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      Toast.show({
        type: "error",
        text1: "Submission Error",
        text2: "Failed to submit quiz results",
      });
    }
  };

  const handleRetryQuiz = () => {
    setQuizResultsModalVisible(false);
    setTimeout(() => handleStartQuiz(), 300);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // FIXED: Enhanced Quiz Question Renderer with safety checks
  const renderQuizQuestion = () => {
    if (!moduleData.quiz?.questions || !moduleData.quiz.questions.length) {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            No questions available for this quiz.
          </Text>
        </View>
      );
    }

    const question = moduleData.quiz.questions[quizAttempt.currentQuestion];

    // Safe guard: if question is undefined, show error
    if (!question) {
      console.error(
        "Question is undefined at index:",
        quizAttempt.currentQuestion
      );
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            Error loading question. Please try again.
          </Text>
        </View>
      );
    }

    const currentAnswer =
      quizAttempt.answers[quizAttempt.currentQuestion] || "";
    const safePoints = question.points || 1; // Default to 1 point if undefined
    const safeOptions = question.options || [];
    const safeQuestionType = question.questionType || "multiple-choice";

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>
            Question {quizAttempt.currentQuestion + 1} of{" "}
            {moduleData.quiz.questions.length}
          </Text>
          <View style={styles.questionPointsBadge}>
            <Text style={styles.questionPoints}>
              {safePoints} {safePoints === 1 ? "point" : "points"}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>
          {question.question || "No question text available"}
        </Text>

        {safeQuestionType === "multiple-choice" && (
          <View style={styles.optionsContainer}>
            {safeOptions.map((option) => {
              const isSelected = currentAnswer === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleQuizAnswer(option.id)}>
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionRadio,
                        isSelected && styles.optionRadioSelected,
                      ]}>
                      {isSelected && <View style={styles.optionRadioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {option.text || "No option text"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {safeQuestionType === "true-false" && (
          <View style={styles.trueFalseContainer}>
            {["true", "false"].map((value) => {
              const isSelected = currentAnswer === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.trueFalseButton,
                    isSelected && styles.trueFalseButtonSelected,
                  ]}
                  onPress={() => handleQuizAnswer(value)}>
                  <Ionicons
                    name={
                      value === "true" ? "checkmark-circle" : "close-circle"
                    }
                    size={32}
                    color={isSelected ? "#619AE4" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      styles.trueFalseText,
                      isSelected && styles.trueFalseTextSelected,
                    ]}>
                    {value === "true" ? "True" : "False"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {safeQuestionType === "short-answer" && (
          <TextInput
            style={styles.shortAnswerInput}
            placeholder="Type your answer here..."
            placeholderTextColor="#6B7280"
            value={currentAnswer}
            onChangeText={handleQuizAnswer}
            multiline
          />
        )}
      </View>
    );
  };

  // Enhanced Tab Renderers
  const renderOverviewTab = () => (
    <Animated.View
      style={[
        styles.tabContent,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Module</Text>
        <Text style={styles.descriptionText}>{moduleData.description}</Text>
      </View>

      {moduleData.learningObjectives &&
        moduleData.learningObjectives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Objectives</Text>
            {moduleData.learningObjectives.map((objective, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.listItemText}>{objective}</Text>
              </View>
            ))}
          </View>
        )}

      {moduleData.requirements && moduleData.requirements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {moduleData.requirements.map((requirement, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.listItemText}>{requirement}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructor</Text>
        <View style={styles.instructorCard}>
          <View
            style={[styles.instructorImage, styles.instructorImagePlaceholder]}>
            <Ionicons name="business" size={32} color="#9CA3AF" />
          </View>
          <View style={styles.instructorInfo}>
            <Text style={styles.instructorName}>SandreaLee Salon</Text>
            <Text style={styles.instructorBio}>
              Professional beauty and salon training experts
            </Text>
            <View style={styles.credentialsContainer}>
              <View style={styles.credentialBadge}>
                <Text style={styles.credentialText}>
                  Certified Beauty Professionals
                </Text>
              </View>
              <View style={styles.credentialBadge}>
                <Text style={styles.credentialText}>Industry Experts</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderVideosTab = () => {
    const videos = moduleData.youtubeVideos || [];

    if (videos.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="videocam-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyStateText}>No Videos Available</Text>
          <Text style={styles.emptyStateSubtext}>
            No video content has been added to this module yet.
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.tabContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        {videos.map((video, index) => {
          const videoUrl = video.videoUrl || video.url;
          const videoId = getYouTubeVideoId(videoUrl);
          const thumbnail =
            video.thumbnail ||
            (videoId
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              : null);
          const isWatched = videoProgress[video._id];

          return (
            <TouchableOpacity
              key={video._id}
              style={styles.videoCard}
              onPress={() => handleVideoPress(video)}>
              <View style={styles.videoThumbnailContainer}>
                {thumbnail ? (
                  <Image
                    source={{ uri: getSafeImageUrl(thumbnail) }}
                    style={styles.videoThumbnail}
                    onError={(e) =>
                      console.log("Video thumbnail error:", e.nativeEvent.error)
                    }
                  />
                ) : (
                  <View style={styles.videoThumbnailPlaceholder}>
                    <Ionicons name="videocam" size={48} color="#6B7280" />
                  </View>
                )}
                <View style={styles.playOverlay}>
                  <Ionicons
                    name="play-circle"
                    size={64}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </View>
                {isWatched && (
                  <View style={styles.watchedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#10B981"
                    />
                    <Text style={styles.watchedText}>Watched</Text>
                  </View>
                )}
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                {video.description && (
                  <Text style={styles.videoDescription} numberOfLines={2}>
                    {video.description}
                  </Text>
                )}
                <View style={styles.videoMeta}>
                  <View style={styles.videoMetaItem}>
                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                    <Text style={styles.videoMetaText}>
                      {video.duration || "10:00"}
                    </Text>
                  </View>
                  <View style={styles.videoMetaItem}>
                    <Ionicons
                      name="videocam-outline"
                      size={16}
                      color="#9CA3AF"
                    />
                    <Text style={styles.videoMetaText}>
                      Video {index + 1} of {videos.length}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    );
  };

  const renderResourcesTab = () => {
    const websiteResources =
      moduleData.resources?.filter(
        (resource) =>
          (resource.type === "website" || resource.type === "document") &&
          isValidUrl(resource.url)
      ) || [];

    const youtubeResources =
      moduleData.youtubeVideos?.map((video) => ({
        ...video,
        type: "youtube" as const,
        fileType: "YouTube Video",
        displayUrl: formatUrlForDisplay(video.url),
      })) || [];

    const allResources = [...websiteResources, ...youtubeResources];

    if (allResources.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyStateText}>No Resources Available</Text>
          <Text style={styles.emptyStateSubtext}>
            No additional resources have been added to this module yet.
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.tabContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        {/* Enhanced Resources Summary */}
        <View style={styles.resourcesSummary}>
          <Text style={styles.resourcesSummaryTitle}>Learning Resources</Text>
          <View style={styles.resourcesStats}>
            <View style={styles.resourceStatItem}>
              <Ionicons name="document-text" size={16} color="#619AE4" />
              <Text style={styles.resourceStatText}>
                {websiteResources.filter((r) => r.type === "document").length}{" "}
                Documents
              </Text>
            </View>
            <View style={styles.resourceStatItem}>
              <Ionicons name="globe" size={16} color="#619AE4" />
              <Text style={styles.resourceStatText}>
                {websiteResources.filter((r) => r.type === "website").length}{" "}
                Websites
              </Text>
            </View>
            <View style={styles.resourceStatItem}>
              <Ionicons name="logo-youtube" size={16} color="#619AE4" />
              <Text style={styles.resourceStatText}>
                {youtubeResources.length} Videos
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Resources List */}
        {allResources.map((resource) => {
          const isViewed = resourceProgress[resource._id];
          let resourceType = resource.type;
          let iconName: "document-text" | "globe" | "logo-youtube" | "link" =
            "link";
          let iconColor = "#619AE4";
          let typeLabel = "Resource";

          if (resourceType === "document") {
            iconName = "document-text";
            iconColor = "#10B981";
            typeLabel = resource.fileType || "Document";
          } else if (resourceType === "website") {
            iconName = "globe";
            iconColor = "#3B82F6";
            typeLabel = "Website";
          } else if (resourceType === "youtube") {
            iconName = "logo-youtube";
            iconColor = "#EF4444";
            typeLabel = "YouTube Video";
          }

          return (
            <TouchableOpacity
              key={resource._id}
              style={styles.resourceCard}
              onPress={() => handleResourcePress(resource)}>
              <View
                style={[
                  styles.resourceIcon,
                  { backgroundColor: `${iconColor}15` },
                ]}>
                <Ionicons name={iconName} size={24} color={iconColor} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                {resource.description && (
                  <Text style={styles.resourceDescription} numberOfLines={2}>
                    {resource.description}
                  </Text>
                )}
                {(resourceType === "website" || resourceType === "document") &&
                  resource.displayUrl && (
                    <View style={styles.resourceUrlContainer}>
                      <Ionicons name="link" size={12} color="#9CA3AF" />
                      <Text style={styles.resourceUrlText} numberOfLines={1}>
                        {resource.displayUrl}
                      </Text>
                    </View>
                  )}
                <View style={styles.resourceMeta}>
                  <View style={styles.resourceTypeBadge}>
                    <Text
                      style={[styles.resourceTypeText, { color: iconColor }]}>
                      {typeLabel}
                    </Text>
                  </View>
                  {isViewed && (
                    <View style={styles.viewedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                      />
                      <Text style={styles.viewedText}>Viewed</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.resourceActions}>
                <TouchableOpacity
                  onPress={() => handleOpenResourceInBrowser(resource)}
                  style={styles.resourceActionButton}>
                  <Ionicons name="open-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    );
  };

  const renderQuizTab = () => {
    if (!moduleData.quiz?.isEnabled || !moduleData.quiz.questions?.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="help-circle-outline" size={64} color="#6B7280" />
          <Text style={styles.emptyStateText}>No Quiz Available</Text>
          <Text style={styles.emptyStateSubtext}>
            This module doesnt have an active quiz yet.
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.tabContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        <View style={styles.quizInfoCard}>
          <View style={styles.quizHeader}>
            <Ionicons name="trophy" size={32} color="#F59E0B" />
            <Text style={styles.quizTitle}>
              {moduleData.quiz.title || `${moduleData.title} Quiz`}
            </Text>
          </View>
          {moduleData.quiz.description && (
            <Text style={styles.quizDescription}>
              {moduleData.quiz.description}
            </Text>
          )}

          <View style={styles.quizStats}>
            <View style={styles.quizStatItem}>
              <Ionicons name="help-circle" size={20} color="#619AE4" />
              <Text style={styles.quizStatText}>
                {moduleData.quiz.questions.length} Questions
              </Text>
            </View>
            <View style={styles.quizStatItem}>
              <Ionicons name="time" size={20} color="#619AE4" />
              <Text style={styles.quizStatText}>
                {moduleData.quiz.timeLimit} minutes
              </Text>
            </View>
            <View style={styles.quizStatItem}>
              <Ionicons name="checkmark-circle" size={20} color="#619AE4" />
              <Text style={styles.quizStatText}>
                {moduleData.quiz.passingScore}% to pass
              </Text>
            </View>
            <View style={styles.quizStatItem}>
              <Ionicons name="refresh" size={20} color="#619AE4" />
              <Text style={styles.quizStatText}>
                {moduleData.quiz.maxAttempts} attempts
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.startQuizButton}
            onPress={handleStartQuiz}>
            <Ionicons name="play-circle" size={24} color="white" />
            <Text style={styles.startQuizButtonText}>Start Quiz</Text>
          </TouchableOpacity>

          <View style={styles.quizNotes}>
            <Ionicons name="information-circle" size={20} color="#9CA3AF" />
            <Text style={styles.quizNotesText}>
              You have {moduleData.quiz.maxAttempts} attempts. Make sure youre
              ready before starting!
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ==================== ENHANCED MAIN RENDER ====================
  if (moduleLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#0F1419", "#1a1f3a"]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#619AE4" />
            <Text style={styles.loadingText}>Loading module details...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#0F1419", "#1a1f3a"]} style={styles.gradient}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {moduleData.title}
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#619AE4"
            />
          }
          showsVerticalScrollIndicator={false}>
          {/* Enhanced Module Info */}
          <View style={styles.moduleInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{moduleData.category}</Text>
            </View>
            <Text style={styles.moduleTitle}>{moduleData.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                <Text style={styles.metaText}>{moduleData.duration} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="bar-chart-outline" size={16} color="#9CA3AF" />
                <Text style={styles.metaText}>{moduleData.difficulty}</Text>
              </View>
              {moduleData.hasQuiz && (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="help-circle-outline"
                    size={16}
                    color="#F59E0B"
                  />
                  <Text style={[styles.metaText, { color: "#F59E0B" }]}>
                    Has Quiz
                  </Text>
                </View>
              )}
            </View>

            {/* Enhanced Progress Bar */}
            {moduleData.progress !== undefined && moduleData.progress > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Your Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {moduleData.progress}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${moduleData.progress}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* FIXED: Enhanced Tabs with proper spacing and all tabs visible */}
          <View style={styles.tabContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContent}>
              {[
                {
                  key: "overview",
                  label: "Overview",
                  icon: "information-circle",
                },
                { key: "videos", label: "Videos", icon: "videocam" },
                { key: "resources", label: "Resources", icon: "document-text" },
                { key: "quiz", label: "Quiz", icon: "help-circle" },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                const getCount = () => {
                  if (tab.key === "videos")
                    return moduleData.youtubeVideos?.length || 0;
                  if (tab.key === "resources") {
                    const websiteCount =
                      moduleData.resources?.filter(
                        (r) => r.type === "website" || r.type === "document"
                      ).length || 0;
                    const youtubeCount = moduleData.youtubeVideos?.length || 0;
                    return websiteCount + youtubeCount;
                  }
                  if (tab.key === "quiz")
                    return moduleData.quiz?.questions?.length || 0;
                  return 0;
                };
                const count = getCount();

                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tab, isActive && styles.tabActive]}
                    onPress={() => setActiveTab(tab.key as typeof activeTab)}>
                    <Ionicons
                      name={tab.icon as any}
                      size={18}
                      color={isActive ? "#619AE4" : "#9CA3AF"}
                      style={styles.tabIcon}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        isActive && styles.tabTextActive,
                      ]}>
                      {tab.label}
                      {count > 0 && ` (${count})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Enhanced Tab Content with proper spacing */}
          <View style={styles.tabContentContainer}>
            {activeTab === "overview" && renderOverviewTab()}
            {activeTab === "videos" && renderVideosTab()}
            {activeTab === "resources" && renderResourcesTab()}
            {activeTab === "quiz" && renderQuizTab()}
          </View>
        </ScrollView>

        {/* Enhanced Video Modal */}
        <Modal
          visible={videoModalVisible}
          animationType="slide"
          onRequestClose={handleCloseVideo}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={handleCloseVideo}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedVideo?.title}
              </Text>
            </View>
            {selectedVideo &&
              (() => {
                const videoUrl = selectedVideo.videoUrl || selectedVideo.url;
                const videoId = getYouTubeVideoId(videoUrl);

                if (!videoId) {
                  return (
                    <View style={styles.resourceErrorContainer}>
                      <Ionicons
                        name="warning-outline"
                        size={48}
                        color="#EF4444"
                      />
                      <Text style={styles.resourceErrorText}>
                        Unable to load video. The video URL may be invalid.
                      </Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(videoUrl)}
                        style={styles.resourceErrorButton}>
                        <Text style={styles.resourceErrorButtonText}>
                          Open in YouTube
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                return (
                  <WebView
                    source={{
                      uri: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
                    }}
                    style={styles.webView}
                    allowsFullscreenVideo
                    mediaPlaybackRequiresUserAction={false}
                  />
                );
              })()}
          </SafeAreaView>
        </Modal>

        {/* Enhanced Resource Viewer Modal */}
        <ResourceViewer
          resource={selectedResource}
          visible={resourceModalVisible}
          onClose={handleCloseResource}
        />

        {/* Enhanced Quiz Modal */}
        <Modal visible={quizModalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.quizModalHeader}>
              <View style={styles.quizHeaderLeft}>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Exit Quiz",
                      "Are you sure you want to exit? Your progress will be lost.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Exit",
                          style: "destructive",
                          onPress: () => {
                            if (quizTimer !== null) clearInterval(quizTimer);
                            setQuizModalVisible(false);
                          },
                        },
                      ]
                    );
                  }}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.quizModalTitle}>Quiz in Progress</Text>
              </View>
              <View style={styles.timerContainer}>
                <Ionicons name="time" size={20} color="#F59E0B" />
                <Text style={styles.timerText}>
                  {formatTime(quizAttempt.timeRemaining)}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.quizContentModal}
              showsVerticalScrollIndicator={false}>
              {renderQuizQuestion()}
            </ScrollView>

            <View style={styles.quizNavigation}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  quizAttempt.currentQuestion === 0 && styles.navButtonDisabled,
                ]}
                onPress={handlePreviousQuestion}
                disabled={quizAttempt.currentQuestion === 0}>
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>

              <View style={styles.quizProgress}>
                <Text style={styles.quizProgressText}>
                  {quizAttempt.currentQuestion + 1} /{" "}
                  {moduleData.quiz?.questions?.length}
                </Text>
              </View>

              {quizAttempt.currentQuestion ===
              (moduleData.quiz?.questions?.length || 0) - 1 ? (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitQuiz}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={handleNextQuestion}>
                  <Text style={styles.navButtonText}>Next</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Enhanced Quiz Results Modal */}
        <Modal visible={quizResultsModalVisible} animationType="fade">
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView
              contentContainerStyle={styles.resultsContainer}
              showsVerticalScrollIndicator={false}>
              <View style={styles.resultsHeader}>
                <View
                  style={[
                    styles.resultsIcon,
                    {
                      backgroundColor: quizResults?.passed
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                    },
                  ]}>
                  <Ionicons
                    name={
                      quizResults?.passed ? "checkmark-circle" : "close-circle"
                    }
                    size={48}
                    color={quizResults?.passed ? "#10B981" : "#EF4444"}
                  />
                </View>
                <Text style={styles.resultsTitle}>
                  {quizResults?.passed ? "Congratulations!" : "Keep Trying!"}
                </Text>
                <Text style={styles.resultsSubtitle}>
                  {quizResults?.passed
                    ? `You passed the quiz with ${quizResults?.score}%`
                    : `You scored ${quizResults?.score}%. You need ${moduleData.quiz?.passingScore}% to pass.`}
                </Text>
              </View>

              <View style={styles.resultsStats}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatNumber}>
                    {quizResults?.score}%
                  </Text>
                  <Text style={styles.resultStatLabel}>Score</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatNumber}>
                    {quizResults?.correctAnswers}/{quizResults?.totalQuestions}
                  </Text>
                  <Text style={styles.resultStatLabel}>Correct</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatNumber}>
                    {formatTime(quizResults?.timeSpent || 0)}
                  </Text>
                  <Text style={styles.resultStatLabel}>Time</Text>
                </View>
              </View>

              {moduleData.quiz?.showResults && quizResults?.answers && (
                <View style={styles.detailedResults}>
                  <Text style={styles.detailedResultsTitle}>Answer Review</Text>
                  <ScrollView
                    style={styles.detailedResultsList}
                    showsVerticalScrollIndicator={false}>
                    {quizResults.answers.map((answer: any, index: number) => (
                      <View key={index} style={styles.resultItem}>
                        <View style={styles.resultItemHeader}>
                          <Text style={styles.resultQuestionNumber}>
                            Question {index + 1}
                          </Text>
                          <View
                            style={[
                              styles.resultStatus,
                              {
                                backgroundColor: answer.isCorrect
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : "rgba(239, 68, 68, 0.1)",
                              },
                            ]}>
                            <Text
                              style={[
                                styles.resultStatusText,
                                {
                                  color: answer.isCorrect
                                    ? "#10B981"
                                    : "#EF4444",
                                },
                              ]}>
                              {answer.isCorrect ? "Correct" : "Incorrect"}
                            </Text>
                          </View>
                        </View>
                        {!answer.isCorrect &&
                          moduleData.quiz?.questions?.[index]?.explanation && (
                            <Text style={styles.resultExplanation}>
                              {moduleData.quiz.questions[index].explanation}
                            </Text>
                          )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.resultsActions}>
                <TouchableOpacity
                  style={styles.closeResultsButton}
                  onPress={() => {
                    setQuizResultsModalVisible(false);
                    setQuizResults(null);
                  }}>
                  <Text style={styles.closeResultsButtonText}>Close</Text>
                </TouchableOpacity>
                {!quizResults?.passed && moduleData.quiz?.allowRetakes && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetryQuiz}>
                    <Text style={styles.retryButtonText}>Retry Quiz</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ==================== FIXED & ENHANCED STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  moduleInfo: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(97, 154, 228, 0.2)",
  },
  categoryText: {
    color: "#619AE4",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  moduleTitle: {
    color: "white",
    fontSize: 28,
    fontFamily: "Urbanist",
    fontWeight: "700",
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    textTransform: "capitalize",
  },
  progressSection: {
    gap: 12,
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
  },
  progressPercentage: {
    color: "#619AE4",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#619AE4",
    borderRadius: 4,
  },
  // FIXED: Enhanced Tab Container with proper spacing
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    backgroundColor: "rgba(15, 20, 25, 0.8)",
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 100,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "rgba(97, 154, 228, 0.15)",
    borderColor: "rgba(97, 154, 228, 0.3)",
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#619AE4",
    fontWeight: "600",
  },
  // FIXED: Enhanced Tab Content Container
  tabContentContainer: {
    flex: 1,
    minHeight: 400,
  },
  tabContent: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  descriptionText: {
    color: "#D1D5DB",
    fontSize: 16,
    fontFamily: "Urbanist",
    lineHeight: 24,
  },
  listItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  listItemText: {
    flex: 1,
    color: "#D1D5DB",
    fontSize: 16,
    fontFamily: "Urbanist",
    lineHeight: 22,
  },
  instructorCard: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  instructorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#374151",
  },
  instructorImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  instructorInfo: {
    flex: 1,
    gap: 8,
  },
  instructorName: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  instructorBio: {
    color: "#9CA3AF",
    fontSize: 15,
    fontFamily: "Urbanist",
    lineHeight: 22,
  },
  credentialsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  credentialBadge: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(97, 154, 228, 0.2)",
  },
  credentialText: {
    color: "#619AE4",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  videoCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 16,
  },
  videoThumbnailContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#374151",
  },
  videoThumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  watchedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  watchedText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  videoInfo: {
    padding: 20,
    gap: 12,
  },
  videoTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
    lineHeight: 24,
  },
  videoDescription: {
    color: "#9CA3AF",
    fontSize: 15,
    fontFamily: "Urbanist",
    lineHeight: 22,
  },
  videoMeta: {
    flexDirection: "row",
    gap: 20,
    marginTop: 4,
  },
  videoMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoMetaText: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  resourceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  resourceInfo: {
    flex: 1,
    gap: 8,
  },
  resourceTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  resourceDescription: {
    color: "#9CA3AF",
    fontSize: 15,
    fontFamily: "Urbanist",
    lineHeight: 22,
  },
  resourceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  resourceTypeBadge: {
    backgroundColor: "rgba(97, 154, 228, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(97, 154, 228, 0.2)",
  },
  resourceTypeText: {
    fontSize: 12,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  viewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewedText: {
    color: "#10B981",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  resourceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resourceActionButton: {
    padding: 8,
  },
  resourcesSummary: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  resourcesSummaryTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
    marginBottom: 16,
  },
  resourcesStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resourceStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resourceStatText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
  },
  resourceUrlContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  resourceUrlText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Urbanist",
    flex: 1,
  },
  quizInfoCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
    gap: 24,
    borderWidth: 1,
    borderColor: "#374151",
  },
  quizHeader: {
    alignItems: "center",
    gap: 16,
  },
  quizTitle: {
    color: "white",
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    textAlign: "center",
  },
  quizDescription: {
    color: "#D1D5DB",
    fontSize: 16,
    fontFamily: "Urbanist",
    lineHeight: 24,
    textAlign: "center",
  },
  quizStats: {
    gap: 16,
  },
  quizStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quizStatText: {
    color: "#D1D5DB",
    fontSize: 16,
    fontFamily: "Urbanist",
  },
  startQuizButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#619AE4",
    paddingVertical: 18,
    borderRadius: 16,
  },
  startQuizButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  quizNotes: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    padding: 16,
    borderRadius: 12,
  },
  quizNotesText: {
    flex: 1,
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Urbanist",
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 20,
  },
  emptyStateText: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#6B7280",
    fontSize: 16,
    fontFamily: "Urbanist",
    textAlign: "center",
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0F1419",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
    backgroundColor: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderTitle: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  webView: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Enhanced Resource Modal Styles
  resourceModalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  resourceModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  resourceModalCloseButton: {
    padding: 8,
  },
  resourceModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resourceModalType: {
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  resourceModalActionButton: {
    padding: 8,
  },
  resourceModalContent: {
    flex: 1,
    padding: 20,
  },
  resourceModalTitle: {
    fontSize: 24,
    fontFamily: "Urbanist",
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  resourceModalDescription: {
    fontSize: 18,
    fontFamily: "Urbanist",
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 26,
  },
  resourceLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  resourceLoadingText: {
    fontSize: 18,
    fontFamily: "Urbanist",
    color: "#6B7280",
  },
  resourceErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 40,
  },
  resourceErrorText: {
    fontSize: 18,
    fontFamily: "Urbanist",
    color: "#EF4444",
    textAlign: "center",
    lineHeight: 26,
  },
  resourceErrorButton: {
    backgroundColor: "#619AE4",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resourceErrorButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  quizModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  quizHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quizModalTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  timerText: {
    color: "#F59E0B",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  quizContentModal: {
    flex: 1,
  },
  questionContainer: {
    padding: 24,
    gap: 24,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionNumber: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  questionPointsBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  questionPoints: {
    color: "#F59E0B",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  questionText: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "600",
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#374151",
  },
  optionButtonSelected: {
    borderColor: "#619AE4",
    backgroundColor: "rgba(97, 154, 228, 0.05)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioSelected: {
    borderColor: "#619AE4",
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#619AE4",
  },
  optionText: {
    flex: 1,
    color: "#D1D5DB",
    fontSize: 18,
    fontFamily: "Urbanist",
    lineHeight: 24,
  },
  optionTextSelected: {
    color: "#619AE4",
    fontWeight: "500",
  },
  trueFalseContainer: {
    flexDirection: "row",
    gap: 16,
  },
  trueFalseButton: {
    flex: 1,
    backgroundColor: "#1F2937",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 16,
    borderWidth: 2,
    borderColor: "#374151",
  },
  trueFalseButtonSelected: {
    borderColor: "#619AE4",
    backgroundColor: "rgba(97, 154, 228, 0.05)",
  },
  trueFalseText: {
    color: "#D1D5DB",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  trueFalseTextSelected: {
    color: "#619AE4",
  },
  shortAnswerInput: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#374151",
    lineHeight: 24,
  },
  quizNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#1F2937",
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  quizProgress: {
    alignItems: "center",
  },
  quizProgressText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "500",
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#374151",
    borderRadius: 12,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#10B981",
    borderRadius: 12,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  resultsContainer: {
    padding: 24,
    gap: 32,
  },
  resultsHeader: {
    alignItems: "center",
    gap: 20,
    paddingVertical: 24,
  },
  resultsIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  resultsTitle: {
    color: "white",
    fontSize: 32,
    fontFamily: "Urbanist",
    fontWeight: "700",
    textAlign: "center",
  },
  resultsSubtitle: {
    color: "#9CA3AF",
    fontSize: 18,
    fontFamily: "Urbanist",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  resultsStats: {
    flexDirection: "row",
    gap: 16,
  },
  resultStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 24,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  resultStatNumber: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  resultStatLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "Urbanist",
  },
  detailedResults: {
    gap: 16,
  },
  detailedResultsTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "Urbanist",
    fontWeight: "700",
  },
  detailedResultsList: {
    maxHeight: 400,
  },
  resultItem: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  resultItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultQuestionNumber: {
    color: "white",
    fontSize: 16,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  resultStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultStatusText: {
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  resultExplanation: {
    color: "#9CA3AF",
    fontSize: 15,
    fontFamily: "Urbanist",
    fontStyle: "italic",
    lineHeight: 22,
  },
  resultsActions: {
    flexDirection: "row",
    gap: 16,
  },
  closeResultsButton: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: "#374151",
    borderRadius: 16,
    alignItems: "center",
  },
  closeResultsButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  retryButton: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: "#F59E0B",
    borderRadius: 16,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  urlDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  urlDisplayText: {
    color: "#374151",
    fontSize: 16,
    fontFamily: "Urbanist",
    flex: 1,
  },
});
