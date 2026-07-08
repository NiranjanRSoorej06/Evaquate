import MetricsGrid from './MetricsGrid';
import BlueprintPanel from './BlueprintPanel';

export default function OverviewTab(props) {
  return (
    <>
      <MetricsGrid data={props.data} />
      <BlueprintPanel
        data={props.data}
        file={props.file}
        handleFileUpload={props.handleFileUpload}
        startAIScan={props.startAIScan}
        selectedCellType={props.selectedCellType}
        setSelectedCellType={props.setSelectedCellType}
        handleCellClick={props.handleCellClick}
        handleWipeBlueprint={props.handleWipeBlueprint}
        isMobile={props.isMobile}
        isProcessing={props.isProcessing}
        processError={props.processError}
      />
    </>
  );
}
