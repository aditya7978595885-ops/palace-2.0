import React, { useCallback, useRef, useState } from 'react';
import { CHAPTERS } from './data/defaultContent';
import { ChapterId, ChapterMeta } from './types/palace';
import { useCustomization } from './hooks/useCustomization';
import { usePhotoUpload } from './hooks/usePhotoUpload';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { ChapterTransition } from './components/ChapterTransition';
import { Navigation } from './components/Navigation';
import { CustomizationPanel } from './components/CustomizationPanel';
import { PalaceArrival } from './scenes/PalaceArrival';
import { GrandFoyer } from './scenes/GrandFoyer';
import { PortraitGallery } from './scenes/PortraitGallery';
import { RoyalBallroom } from './scenes/RoyalBallroom';
import { RoseGarden } from './scenes/RoseGarden';

export const App: React.FC = () => {
  const {
    customization,
    isLoaded,
    saveStatus,
    activeTheme,
    updateField,
    setTheme,
    updatePlaque,
    updateDecoratives,
    updateAssetOverride,
    setFrameCount,
    updatePhoto,
    deletePhotoImage,
    reorderPhotos,
    addMemory,
    updateMemory,
    deleteMemory,
    resetToDefault,
    importFromJson,
  } = useCustomization();

  const {
    isUploading,
    uploadError,
    clearError,
    uploadToFrame,
    uploadMultipleFiles,
  } = usePhotoUpload({
    photos: customization.photos,
    updatePhoto,
  });

  const [currentChapter, setCurrentChapter] = useState<ChapterId>('arrival');
  const [transitionChapter, setTransitionChapter] = useState<ChapterMeta | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [, setIntroFinished] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  const navigateToChapter = useCallback(
    (target: ChapterId) => {
      if (target === currentChapter) return;
      const meta = CHAPTERS.find((c) => c.id === target) ?? null;
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }

      setTransitionChapter(meta);
      transitionTimerRef.current = window.setTimeout(() => {
        setCurrentChapter(target);
        transitionTimerRef.current = window.setTimeout(() => {
          setTransitionChapter(null);
        }, 520);
      }, 480);
    },
    [currentChapter]
  );

  return (
    <ErrorBoundary>
      <main
        className="relative h-screen w-screen overflow-hidden"
        style={{ backgroundColor: activeTheme.background }}
      >
        {/* Cinematic Loading Screen */}
        <LoadingScreen
          ready={isLoaded}
          title={customization.arrivalTitle}
          recipientName={customization.recipientName}
          onFinished={() => setIntroFinished(true)}
        />

        {/* Smooth Chapter Transition Curtain */}
        <ChapterTransition transitionChapter={transitionChapter} />

        {/* Persistent Royal Top Navigation & Audio Controls */}
        <Navigation
          currentChapter={currentChapter}
          recipientName={customization.recipientName}
          palaceTitle={customization.arrivalTitle}
          musicEnabled={customization.decoratives.enableMusic}
          musicVolume={customization.decoratives.musicVolume}
          customAudioUrl={customization.assets.customAudioUrl}
          onSelectChapter={navigateToChapter}
          onToggleMusic={(enabled) => updateDecoratives({ enableMusic: enabled })}
          onOpenCustomize={() => setCustomizeOpen(true)}
        />

        {/* Active 3D Chapter Stage */}
        <div className="h-full w-full">
          {currentChapter === 'arrival' && (
            <PalaceArrival
              customization={customization}
              theme={activeTheme}
              onEnterPalace={() => navigateToChapter('foyer')}
            />
          )}

          {currentChapter === 'foyer' && (
            <GrandFoyer
              customization={customization}
              theme={activeTheme}
              onNavigateChapter={navigateToChapter}
            />
          )}

          {currentChapter === 'gallery' && (
            <PortraitGallery
              customization={customization}
              theme={activeTheme}
              isUploading={isUploading}
              onUploadSinglePhoto={uploadToFrame}
              onUploadMultiplePhotos={uploadMultipleFiles}
              onUpdatePhoto={updatePhoto}
              onDeletePhotoImage={deletePhotoImage}
              onSetFrameCount={setFrameCount}
              onChangeLayout={(layout) => updateField('galleryLayout', layout)}
            />
          )}

          {currentChapter === 'ballroom' && (
            <RoyalBallroom
              customization={customization}
              theme={activeTheme}
              onUpdatePlaque={updatePlaque}
            />
          )}

          {currentChapter === 'garden' && (
            <RoseGarden
              customization={customization}
              theme={activeTheme}
              onChangeCrownStyle={(style) => updateField('crownStyle', style)}
            />
          )}
        </div>

        {/* Full Personalization Dashboard */}
        <CustomizationPanel
          isOpen={customizeOpen}
          customization={customization}
          saveStatus={saveStatus}
          isUploading={isUploading}
          uploadError={uploadError}
          onClose={() => setCustomizeOpen(false)}
          onUpdateField={updateField}
          onSetTheme={setTheme}
          onUpdatePlaque={updatePlaque}
          onUpdateDecoratives={updateDecoratives}
          onUpdateAssetOverride={updateAssetOverride}
          onSetFrameCount={setFrameCount}
          onUpdatePhoto={updatePhoto}
          onDeletePhotoImage={deletePhotoImage}
          onReorderPhotos={reorderPhotos}
          onUploadSinglePhoto={uploadToFrame}
          onUploadMultiplePhotos={uploadMultipleFiles}
          onClearUploadError={clearError}
          onAddMemory={addMemory}
          onUpdateMemory={updateMemory}
          onDeleteMemory={deleteMemory}
          onResetToDefault={resetToDefault}
          onImportJson={importFromJson}
        />
      </main>
    </ErrorBoundary>
  );
};

export default App;
